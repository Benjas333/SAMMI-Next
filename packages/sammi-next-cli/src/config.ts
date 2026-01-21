import fs from 'node:fs';
import path from 'node:path';
import { BuildEnvironmentOptions, resolveBuilderOptions, ResolvedBuilderOptions, ResolvedBuildOptions } from './build';
import { createLogger, Logger, LogTypes } from './logger';
import { PackageCache } from './packages';
import { isObject, mergeConfig, normalizePath } from './utils';
import colors from 'picocolors';
import { DEFAULT_CONFIG_FILES } from './constants';

export interface ResolvedEnvironmentOptions {
    build: BuildEnvironmentOptions
}

export type ResolvedConfig = Readonly<
    Omit<
        UserConfig,
        | 'build'
        | 'environments'
    > & {
        configFile: string | undefined
        inlineConfig: InlineConfig
        root: string
        command: 'build' | 'dev'
        /** `true` when build */
        isBundled: boolean
        /** @internal */
        mainConfig: ResolvedConfig | null
        builder: ResolvedBuilderOptions | undefined
        build: ResolvedBuildOptions
        logger: Logger
        environments: Record<string, ResolvedEnvironmentOptions>
    }
>;

export interface EnvironmentOptions {
    /**
     * Build specific options
     */
    build?: BuildEnvironmentOptions
}

export interface UserConfig extends EnvironmentOptions {
    /**
     * Project root directory. Can be an absolute path, or a path relative from the location of the config file itself.
     * @default process.cwd()
     */
    root?: string
    /**
     * Explicitly set a mode to run in.
     * This will override the default mode for each command, and can be overridden by the command line --mode option.
     */
    mode?: string
    /**
     * Log level.
     * @default 'info'
     */
    logLevel?: LogTypes
    /**
     * Custom logger.
     */
    customLogger?: Logger
    /**
     * @default true
     */
    clearScreen?: boolean
    /**
     * Environment overrides
     */
    environments?: Record<string, EnvironmentOptions>
}

export interface InlineConfig extends UserConfig {
    configFile?: string | false
}

export interface ConfigEnv {
    /**
     * 'dev': during dev ('sammi-next dev' command)
     * 'build': when building for production ('sammi-next build' command)
     */
    command: 'build' | 'dev'
    mode: string
}

const defaultBadChars = ['#', '?', '*'];
function checkBadCharactersInPath(
    name: string,
    path: string,
    logger: Logger
): void {
    const badChars = [];

    for (const char of defaultBadChars) {
        if (!path.includes(char)) continue;

        badChars.push(char)
    }

    if (badChars.length) {
        const charString = badChars.map(c => `"${c}"`).join(' and ');
        const inflectedChars = 'character' + (badChars.length > 1 ? 's' : '');

        logger.warn(
            colors.yellow(
                `${name} contains the ${charString} ${inflectedChars} (${colors.cyan(
                    path,
                )}), which may not work when running SAMMI Next. Consider renaming the directory | file to remove the characters.`,
            ),
        );
    }
}

async function bundleAndLoadConfigFile(resolvedPath: string) {
    const isESM =
        typeof process.versions.deno === 'string' || isFilePathESM(resolvedPath);

    const bundled = await bundleConfigFile(resolvedPath, isESM);
    const userConfig = await loadConfigFromBundledFile(
        resolvedPath,
        bundled.code,
        isESM,
    );

    return {
        configExport: userConfig,
        dependencies: bundled.dependencies,
    };
}

export async function loadConfigFromFile(
    configEnv:ConfigEnv,
    configFile?: string,
    configRoot: string = process.cwd(),
    logLevel?: LogTypes,
    customLogger?: Logger,
): Promise<{
    path: string,
    config: UserConfig,
    dependencies: string[],
} | null> {
    let resolvedPath: string | undefined;

    if (configFile) {
        resolvedPath = path.resolve(configFile);
    } else {
        for (const filename of DEFAULT_CONFIG_FILES) {
            const filePath = path.resolve(configRoot, filename);
            if (!fs.existsSync(filePath)) continue;

            resolvedPath = filePath;
            break;
        }
    }

    if (!resolvedPath)
        return null;

    try {
        const resolved = bundleAndLoadConfigFile;
        const { configExport, dependencies } = await resolved(resolvedPath);

        const config = await (typeof configExport === 'function'
            ? configExport(configEnv)
            : configExport)
        if (!isObject(config))
            throw new Error('config must export or return an object.');

        return {
            path: normalizePath(resolvedPath),
            config,
            dependencies,
        }
    } catch (e) {
        const logger = createLogger(logLevel, { customLogger })
        checkBadCharactersInPath('The config path', resolvedPath, logger);
        logger.error(colors.red(`failed to load config from ${resolvedPath}`), {
            error: e,
        });
        throw e;
    }
}

export async function resolveConfig(
    inlineConfig: InlineConfig,
    command: 'build' | 'dev',
    defaultMode = 'development',
    defaultNodeEnv = 'development',
    /** @internal */
    patchConfig?: ((config: ResolvedConfig) => void),
): Promise<ResolvedConfig> {
    let config = inlineConfig;
    config.build ??= {};

    // let configFileDependencies: string[] = [];
    let mode = inlineConfig.mode || defaultMode;
    const isNodeEnvSet = !!process.env.NODE_ENV;
    const packageCache: PackageCache = new Map();

    if (!isNodeEnvSet)
        process.env.NODE_ENV = defaultNodeEnv;

    const configEnv: ConfigEnv = {
        mode,
        command,
    }

    let { configFile } = config;
    if (configFile !== false) {
        const loadResult = await loadConfigFromFile(
            configEnv,
            configFile,
            config.root,
            config.logLevel,
            config.customLogger
        );
        if (loadResult) {
            config = mergeConfig(loadResult.config, config);
            configFile = loadResult.path;
            configFileDependencies = loadResult.dependencies
        }
    }

    configEnv.mode = mode = inlineConfig.mode || config.mode || mode;

    const isBuild = command === 'build';

    config.environments ??= {};
    if (!config.environments.client) {
        config.environments = { client: {}, ...config.environments };
    }

    const logger = createLogger(config.logLevel, {
        allowClearScreen: config.clearScreen,
        customLogger: config.customLogger,
    });

    const resolvedRoot = normalizePath(
        config.root ? path.resolve(config.root) : process.cwd(),
    );

    checkBadCharactersInPath('The project root', resolvedRoot, logger);

    const configEnvironmentsClient = config.environments.client;
    configEnvironmentsClient.dev ??= {};

    if (!config.environments.client || !isBuild)
        throw new Error('Required environments configuration were stripped out in the config hook');

    const defaultEnvironmentOptions = getDefaultEnvironmentOptions(config);
    const defaultClientEnvironmentOptions: UserConfig = {
        ...defaultEnvironmentOptions
    }
    const defaultNonClientEnvironmentOptions: UserConfig = {
        ...defaultEnvironmentOptions,
        dev: {
            ...defaultEnvironmentOptions.dev,
            createEnvironment: undefined,
        },
        build: {
            ...defaultEnvironmentOptions.build,
            createEnvironment: undefined,
        },
    }

    for (const name in config.environments) {
        if (!Object.hasOwn(config.environments, name)) continue;

        config.environments[name] = mergeConfig(
            name === 'client'
                ? defaultClientEnvironmentOptions
                : defaultNonClientEnvironmentOptions,
            config.environments[name],
        );
    }

    await runConfigEnvironmentHook(
        config.environments,
        logger,
        configEnv,
    );

    const isBundleDev = false;

    const resolvedEnvironments: Record<string, ResolvedEnvironmentOptions> = {};
    for (const environmentName in config.environments) {
        if (!Object.hasOwn(config.environments, environmentName)) continue;

        resolvedEnvironments[environmentName] = resolveEnvironmentOptions(
            config.environments[environmentName],
            logger,
            environmentName,
            isBundleDev,
        );
    }

    const resolveDevEnvironmentOptions = resolveDevEnvironmentOptions(
        config.build ?? {},
        logger,
        undefined,
        isBundleDev,
    )

    const isProduction = process.env.NODE_ENV === 'production';

    const pkgDir = findNearestPackageData(resolvedRoot, packageCache)?.dir;

    const builder = resolveBuilderOptions(config.builder);

    let resolved: ResolvedConfig;

    resolved = {
        configFile: configFile ? normalizePath(configFile) : undefined,
        inlineConfig,
        root: resolvedRoot,
        command,
        mode,
        isBundled: isBuild,
        mainConfig: null,
        builder,
        logger,
        dev: resolvedDevEnvironmentOptions,
        build: resolvedBuildOptions,
        environments: resolvedEnvironments,
    }
    resolved = {
        ...config,
        ...resolved,
    }
    patchConfig?.(resolved)

    const resolvedBuildOutDir = normalizePath(
        path.resolve(resolved.root, resolved.build.outDir),
    )
    if (
        isParentDirectory(resolvedBuildOutDir, resolved.root) ||
        resolvedBuildOutDir === resolved.root
    ) {
        resolved.logger.warn(
            colors.yellow('(!) build.outDir must not be the same directory of root or a parent directory of root as this could cause SAMMI Next to overwriting source files with build outputs.')
        );
    }

    return resolved;
}
