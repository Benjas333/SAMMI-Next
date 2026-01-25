

import { AuthorInfo, ExtensionConfig, ResolvedExtensionConfig } from "@shared/config-types";
import Ajv, { JSONSchemaType } from "ajv";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG_EXTENSIONS } from "./constants";
import { BuildCLIOptions } from "./cli";
import { BuildModes, mergeBuilderOptions, ResolvedBuildOptions } from "./build";

const ajv = new Ajv();

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
            minLength: 1,
        },
        url: {
            type: "string",
            format: "url",
            nullable: true,
        },
        email: {
            type: "string",
            format: "email",
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
            anyOf: [
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

export async function loadConfig(rootDir: string) {
    for (const ext of DEFAULT_CONFIG_EXTENSIONS) {
        const configPath = path.join(rootDir, `sammi.config${ext}`);

        if (!fs.existsSync(configPath)) continue;

        try {
            const { createJiti } = await import('jiti');
            const jiti = createJiti(rootDir, {
                interopDefault: true,
                moduleCache: true,
            });

            const config = await jiti.import(configPath, { default: true });

            return validateExtensionConfig(config, configPath);
        } catch (error) {
            throw new Error(`Error loading ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    const jsonPath = path.join(rootDir, 'sammi.config.json');
    if (fs.existsSync(jsonPath)) {
        try {
            const raw = fs.readFileSync(jsonPath, 'utf-8');
            const config = JSON.parse(raw) as unknown;
            return validateExtensionConfig(config, jsonPath);
        } catch (error) {
            throw new Error(`Error loading ${jsonPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    throw new Error('SAMMI Next extension config file not found in the root dir.');
}


function validateExtensionConfig(config: unknown, configPath: string): ExtensionConfig {
    if (!configValidator(config)) {
        const errors = configValidator.errors?.map(err => `    - ${err.instancePath} ${err.message}`).join('\n');
        throw new Error(`Invalid config from ${configPath}:\n${errors}`);
    }

    return config;
}

export function resolveExtensionConfig(config: ExtensionConfig, rootDir: string): ResolvedExtensionConfig {
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

export async function resolveBuildConfig(
    root: string | undefined,
    command: string,
    build_cli: BuildCLIOptions,
) {
    const mode = BuildModes.findIndex(m => {
        return m.toLowerCase() === command.toLowerCase();
    });
    if (mode < 0)
        throw new Error(`Invalid mode: ${command}. It must be one of: ${BuildModes.join(', ')}`);

    const rootDir = root ?? process.cwd();
    const config = await loadConfig(rootDir);

    config.out ??= {};

    config.out.dir = build_cli.outDir ?? config.out.dir;
    config.out.js = build_cli.outJs ?? config.out.js;
    config.out.sef = build_cli.outSef ?? config.out.sef;

    const resolvedConfig = resolveExtensionConfig(config, rootDir);

    const resolved: ResolvedBuildOptions = {
        rootDir,
        mode,
        config: resolvedConfig
    }

    resolved.config.tsdownConfig = mergeBuilderOptions(resolved);
    return resolved;
}
