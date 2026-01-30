

import { AuthorInfo, ExtensionConfig, ResolvedExtensionConfig } from "@shared/config-types";
import Ajv, { JSONSchemaType } from "ajv";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG_EXTENSIONS } from "./constants";
import { BuilderCLIOptions, GlobalCLIOptions } from "./cli";
import { mergeBuilderOptions, ResolvedBuildOptions } from "./build";
import { createLogger } from "./logger";
import { LogLevel, LogLevels } from "@shared/logger-types";
import { BuildMode, BuildModeKey, BuildModes } from "@shared/build-types";

const ajv = new Ajv({ allowUnionTypes: true });

ajv.addKeyword({
    keyword: "fileExists",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validate: (_schema: any, data: any) => {
        if (!data) return true;

        return fs.existsSync(data as string);
    },
    errors: false
});

const authorObjectSchema: JSONSchemaType<AuthorInfo> = {
    type: "object",
    properties: {
        name: {
            type: "string",
            // minLength: 1,
        },
        url: {
            type: "string",
            // format: "uri",
            nullable: true,
        },
        email: {
            type: "string",
            // format: "email",
            nullable: true,
        },
    },
    required: ["name"],
    additionalProperties: false,
};

const schema: JSONSchemaType<ExtensionConfig> = {
    type: "object",
    properties: {
        id: {
            type: "string",
            minLength: 1,
            pattern: "^[a-zA-Z0-9-_]+$",
        },
        name: {
            type: "string",
            minLength: 1,
            pattern: "^[a-zA-Z0-9 -_]+$",
        },
        info: {
            type: "string",
            default: "",
            nullable: true,
        },
        version: {
            type: "string",
            minLength: 1,
            pattern: "^\\d+(?:\\.\\d+)*(?:-.*)?$",
        },
        author: {
            type: ["string", "object", "array"],
            oneOf: [
                { type: "string" },
                authorObjectSchema,

                {
                    type: "array",
                    items: {
                        anyOf: [
                            { type: "string" },
                            authorObjectSchema,
                        ],
                    },
                },
            ],
            default: undefined,
            nullable: true,
        },
        entry: {
            type: "string",
            minLength: 1,
            fileExists: true,
        },
        external: {
            type: "string",
            minLength: 1,
            fileExists: true,
            nullable: true,
        },
        over: {
            type: "string",
            minLength: 1,
            fileExists: true,
            nullable: true,
        },
        out: {
            type: "object",
            properties: {
                dir: {
                    type: "string",
                    minLength: 1,
                    pattern: "^[^<>:\"|?*]+$",
                    default: "dist",
                    nullable: true,
                },
                js: {
                    type: "string",
                    minLength: 4,
                    pattern: "^[\\w\\-. ]+\\.js$",
                    default: "extension.js",
                    nullable: true,
                },
                sef: {
                    type: "string",
                    minLength: 5,
                    pattern: "^[\\w\\-. ]+\\.sef$",
                    default: "extension.sef",
                    nullable: true,
                }
            },
            required: [],
            nullable: true,
            additionalProperties: false,
        },
        nextConfig: {
            type: "object",
            required: [],
            nullable: true,
            additionalProperties: true,
        },
        tsdownConfig: {
            type: "object",
            required: [],
            nullable: true,
            additionalProperties: true,
        },
    },
    required: ["name", "id", "version", "entry"],
    additionalProperties: true,
};

const configValidator = ajv.compile(schema);

function validateExtensionConfig(config: unknown, configPath: string): ExtensionConfig {
    if (!configValidator(config)) {
        const errors = configValidator.errors?.map(err => `    - ${err.instancePath} ${err.message}`).join('\n');
        throw new Error(`Invalid config from ${configPath}:\n${errors}`);
    }

    return config;
}

async function loadConfigFromPath(rootDir: string, path: string) {
    try {
        const { createJiti } = await import('jiti');
        const jiti = createJiti(rootDir, {
            interopDefault: true,
            moduleCache: true,
        });

        const config = await jiti.import(path, { default: true });

        return validateExtensionConfig(config, path);
    } catch (error) {
        throw new Error(`Error loading ${path}:\n${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function loadConfig(rootDir: string, customFile?: string) {
    if (customFile) {
        const configPath = path.join(rootDir, customFile);

        if (!fs.existsSync(configPath))
            throw new Error(`The custom config file path was not found: ${configPath}`);

        return await loadConfigFromPath(rootDir, configPath);
    }

    for (const ext of DEFAULT_CONFIG_EXTENSIONS) {
        const configPath = path.join(rootDir, `sammi.config${ext}`);

        if (!fs.existsSync(configPath)) continue;

        return await loadConfigFromPath(rootDir, configPath);
    }

    throw new Error('SAMMI Next extension config file not found in the root dir.');
}

export function resolveExtensionConfig(
    config: ExtensionConfig,
    rootDir: string
): ResolvedExtensionConfig {
    const resolved: ResolvedExtensionConfig = {
        id: config.id,
        name: config.name,
        version: config.version,
        info: config.info || '',
        entry: path.resolve(rootDir, config.entry),
        external: config.external ? path.resolve(rootDir, config.external) : '',
        over: config.over ? path.resolve(rootDir, config.over) : '',
        out: {
            dir: config.out?.dir || 'dist',
            js: config.out?.js || 'extension.js',
            sef: config.out?.sef || 'extension.sef',
        },
        nextConfig: {
            mode :config.nextConfig?.mode,
            logLevel: config.nextConfig?.logLevel || "info",
            customLogger: config.nextConfig?.customLogger,
            clearScreen: config.nextConfig?.clearScreen ?? true,
            watch: config.nextConfig?.watch ?? false,
        },
        tsdownConfig: config.tsdownConfig || {},
    };

    if (!fs.existsSync(resolved.entry))
        throw new Error(`Entry file not found: ${resolved.entry}`);

    if (resolved.external && !fs.existsSync(resolved.external))
        throw new Error(`External file not found: ${resolved.external}`);

    if (resolved.over && !fs.existsSync(resolved.over))
        throw new Error(`Over file not found: ${resolved.over}`);

    return resolved;
}

export async function resolveConfig(
    root: string | undefined,
    command: BuildModeKey,
    globalCLI: GlobalCLIOptions,
    builderCLI: BuilderCLIOptions,
): Promise<ResolvedBuildOptions> {
    const rootDir = root ?? process.cwd();
    const config = await loadConfig(rootDir, globalCLI.config);

    config.out ??= {};

    config.out.dir = builderCLI.outDir ?? config.out.dir;
    config.out.js = builderCLI.outJs ?? config.out.js;
    config.out.sef = builderCLI.outSef ?? config.out.sef;

    config.nextConfig ??= {};

    if (globalCLI.logLevel != null && !LogLevels.includes(globalCLI.logLevel))
        throw new Error(`Invalid logLevel: ${globalCLI.logLevel}. It must be one of: ${LogLevels.join(', ')}`);

    if (globalCLI.mode != null && !BuildModes.includes(globalCLI.mode))
        throw new Error(`Invalid mode: ${globalCLI.mode}. It must be one of: ${BuildModes.join(', ')}`);

    const mode = globalCLI.mode ?? config.nextConfig.mode ?? command;
    config.nextConfig.mode = mode;
    config.nextConfig.logLevel = globalCLI.logLevel ?? config.nextConfig.logLevel;
    config.nextConfig.clearScreen = globalCLI.clearScreen ?? config.nextConfig.clearScreen;
    config.nextConfig.watch = builderCLI.watch ?? config.nextConfig.watch;

    const resolvedConfig = resolveExtensionConfig(config, rootDir);

    const resolved: ResolvedBuildOptions = {
        config: resolvedConfig,
        rootDir,
        mode: BuildMode[mode],
        logger: createLogger(LogLevel[resolvedConfig.nextConfig.logLevel], {
            allowClearScreen: resolvedConfig.nextConfig.clearScreen,
            customLogger: resolvedConfig.nextConfig.customLogger,
        })
    };

    resolved.config.tsdownConfig = mergeBuilderOptions(resolved);
    return resolved;
}
