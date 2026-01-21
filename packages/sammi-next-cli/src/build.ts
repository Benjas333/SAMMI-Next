import colors from 'picocolors';
import chokidar, { FSWatcher } from 'chokidar';
import { BaseEnvironment } from "./baseEnvironment";
import { EnvironmentOptions, InlineConfig, resolveConfig, ResolvedConfig, ResolvedEnvironmentOptions } from "./config";
import { Rolldown, TsdownBundle, UserConfig as TsdownOptions, build } from 'tsdown';
import { displayTime, mergeConfig, mergeWithDefaults } from "./utils";
import { VERSION } from './constants';
import path from 'node:path';
import { Logger } from './logger';
// import type { ChunkMetadata } from '../types/metadata';

export interface BuildEnvironmentOptions {
    /**
     * Directory relative from 'root' where build output will be placed.
     * If the directory exists, it will be removed before the build.
     * @default "dist"
     */
    outDir?: string
    /**
     * Set to `false` to disable minification.
     * @default true
     */
    minify?: boolean
    /**
     * Will be merged with internal tsdown options.
     * https://tsdown.dev/reference/api/Interface.UserConfig
     */
    tsdownOptions?: TsdownOptions
    /**
     * Empty outDir on write.
     * @default true when outDir is a sub directory of project root
     */
    emptyOutDir?: boolean | null
    watch?: Rolldown.WatcherOptions | null
    /**
     * Create the Build Environment instance
     */
    createEnvironment?: (
        name: string,
        config: ResolvedConfig,
    ) => Promise<BuildEnvironment> | BuildEnvironment
}

export type BuildOptions = BuildEnvironmentOptions;

export type ResolvedBuildOptions = Required<BuildOptions>;

export class BuildEnvironment extends BaseEnvironment {
    mode = 'build' as const

    isBuilt = false

    constructor(
        name: string,
        config: ResolvedConfig,
        setup?: {
            options?: EnvironmentOptions
        },
    ) {
        let options = config.environments[name];
        if (!options)
            throw new Error(`Environment "${name}" is not defined in the config.`);

        if (setup?.options) {
            options = mergeConfig(
                options,
                setup.options,
            ) as ResolvedEnvironmentOptions
        }
        super(name, config, options)
    }

    // async init(): Promise<void> {
    //     if (this._initiated) return;

    //     this._initiated = true;
    // }
}

export interface SNextBuilder {
    environments: Record<string, BuildEnvironment>
    config: ResolvedConfig
    buildApp(): Promise<void>
    build(
        environment: BuildEnvironment,
    ): Promise<FSWatcher | TsdownBundle[]>
}

export interface BuilderOptions {
    buildApp?: (builder: SNextBuilder) => Promise<void>
}

const _builderOptionsDefaults = Object.freeze({

} satisfies BuilderOptions);
export const builderOptionsDefaults: Readonly<Partial<BuilderOptions>> = _builderOptionsDefaults;

export function resolveBuilderOptions(
    options: BuilderOptions | undefined,
): ResolvedBuilderOptions | undefined {
    if (!options) return

    return mergeWithDefaults(
        { ..._builderOptionsDefaults, buildApp: async () => { /* empty */ } },
        options,
    )
}

export type ResolvedBuilderOptions = Required<BuilderOptions>;

function resolveConfigToBuild(
    inlineConfig: InlineConfig = {},
    patchConfig?: (config: ResolvedConfig) => void,
): Promise<ResolvedConfig> {
    return resolveConfig(
        inlineConfig,
        'build',
        "production",
        "production",
        patchConfig,
    );
}

// export class ChunkMetadataMap {
//     private _inner = new Map<string, ChunkMetadata>();
//     private _resetChunks = new Set<string>();

//     private _getKey(chunk: Rendered)
// }

export function clearLine(): void {
    const tty = process.stdout.isTTY && !process.env.CI;
    if (!tty) return;

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
}

async function buildOnce(logger: Logger) {
    const startTime = Date.now();
    const bundle = await build();

    logger.info(`${colors.green(`✓ built in ${displayTime(Date.now() - startTime)}`)}`);
    return { bundle, startTime };
}

async function buildEnvironment(
    environment:BuildEnvironment
) {
    const { logger, config } = environment;
    const { root, build: options } = config;

    logger.info(
        colors.cyan(
            `SAMMINext v${VERSION} ${colors.green(
                `building ${environment.name} environment for ${environment.config.mode}...`,
            )}`
        ),
    )

    let bundle: TsdownBundle[] | undefined
    let startTime: number | undefined
    try {
        const res = await buildOnce(logger);
        bundle = res.bundle;
        startTime = res.startTime;

        if (!options.watch) return bundle;

        logger.info(colors.cyan('\nwatching for file changes...'))

        const watcher = chokidar.watch(path.join(root, "src"), { ignoreInitial: true });
        let timer: NodeJS.Timeout | null = null;

        watcher.on('all', (event, p) => {
            logger.info(colors.cyan(`${event}: ${p}`));
            if (timer)
                clearTimeout(timer);

            timer = setTimeout(() => {
                buildOnce(logger).then((res) => {
                    bundle = res.bundle;
                    startTime = res.startTime;
                }).catch(e => console.error(e));
            }, 100);
        })
        return watcher;
    } catch (error) {
        clearLine()
        if (startTime) {
            logger.error(`${colors.red('✗')} Build failed in ${displayTime(Date.now() - startTime)}`)
            startTime = undefined
        }
        throw error
    }
}

export async function createBuilder(
    inlineConfig: InlineConfig = {},
): Promise<SNextBuilder> {
    const patchConfig = (resolved: ResolvedConfig) => {
        const environmentName = 'client';
        // @ts-expect-error whatever
        resolved.build = {
            ...resolved.environments[environmentName].build
        }
    }
    const config = await resolveConfigToBuild(inlineConfig, patchConfig);
    const configBuilder = config.builder ?? resolveBuilderOptions({})!;

    const environments: Record<string, BuildEnvironment> = {}

    const builder: SNextBuilder = {
        environments,

        config,

        async buildApp() {
            await configBuilder.buildApp(builder);

            if (
                Object.values(builder.environments).every(
                    (environment) => !environment.isBuilt,
                )
            ) {
                for (const environment of Object.values(builder.environments)) {
                    await builder.build(environment)
                }
            }
        },
        async build(environment) {
            const output = await buildEnvironment(environment);
            environment.isBuilt = true;
            return output;
        },
    }

    async function setupEnvironment(name:string, config: ResolvedConfig) {
        const environment = await config.build.createEnvironment(name, config);
        // await environment.init();
        environments[name] = environment;
    }

    const environmentConfigs: [string, ResolvedConfig][] = [];
    for (const environmentName in config.environments) {
        if (!Object.hasOwn(config.environments, environmentName)) continue;

        let environmentConfig = config;
        const patchConfig = (resolved: ResolvedConfig) => {
            resolved.build = {
                ...resolved.environments[environmentName].build,
            };
        }

        environmentConfig = await resolveConfigToBuild(
            inlineConfig,
            patchConfig,
        );

        environmentConfigs.push([environmentName, environmentConfig]);
    }
    await Promise.all(
        environmentConfigs.map(
            async ([environmentName, environmentConfig]) =>
                await setupEnvironment(environmentName, environmentConfig),
        ),
    )

    return builder;
}
