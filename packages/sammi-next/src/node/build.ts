import fs from 'node:fs';
import path from 'node:path';
import colors from 'picocolors';
import chokidar from 'chokidar';
import { ResolvedExtensionConfig } from "@shared/config-types";
import { build, InlineConfig as TsdownConfig, TsdownBundle } from "tsdown";
import { GLOBAL_NAME, SAMMI_NEXT_PACKAGE_DIR, VERSION } from "./constants";
import { displayTime } from './utils';
import lodash from 'lodash';
import { Logger } from '@shared/logger-types';
import { BuildMode } from '@shared/build-types';
// import nodePolyfills from '@rolldown/plugin-node-polyfills';

export interface BuildOptions {
    config: ResolvedExtensionConfig;
    rootDir: string;
    mode?: BuildMode;
    logger?: Logger;
}

export type ResolvedBuildOptions = Required<BuildOptions>;

function readOptionalFile(path: string): string | undefined {
    if (!fs.existsSync(path)) return;

    return fs.readFileSync(path, 'utf-8');
}

function hasDefaultExportFallback(options: ResolvedBuildOptions): boolean {
    const { rootDir, config, logger } = options;
    const jsPath = path.join(rootDir, config.out.dir, config.out.js);
    const CommandRE = /SAMMIExtensions\s*\|\|\s*{}[;,]\n?\(function\((\w+)\)\s*{.*\1.default\s*=\s*\w+/s;

    try {
        const jsScript = fs.readFileSync(jsPath, "utf-8");
        return CommandRE.test(jsScript);
    } catch (error) {
        logger.warn(colors.yellow(`Error reading built file: ${jsPath}
${error instanceof Error ? error.message : String(error)}
Skipping [insert_command] section...`));
        return false;
    }
}

// TODO: find a better way for the default export analyzer
// async function hasDefaultExport(options: ResolvedBuildOptions): Promise<boolean> {
//     const { rootDir, config, logger } = options;

//     try {
//         const { createJiti } = await import('jiti');
//         const jiti = createJiti(rootDir, {
//             interopDefault: true,
//             moduleCache: false,
//         });

//         const defaultExport = await jiti.import(config.entry, { default: true });

//         return typeof defaultExport === 'function';
//         // const script = fs.readFileSync(config.entry, "utf-8");

//         // const ast = parser.parse(script, {
//         //     sourceType: 'module',
//         //     plugins: ['typescript', 'jsx'],
//         // });

//         // let hasDefault = false;
//         // traverse(ast, {
//         //     ExportDefaultDeclaration() {
//         //         hasDefault = true;
//         //     },
//         // });

//         // return hasDefault;
//     } catch (error) {
//         logger.warn(`Error analyzing entry file: ${config.entry}
// ${error instanceof Error ? error.message : String(error)}
// Trying regex on built JS file...`);
//         return hasDefaultExportFallback(options);
//     }
// }

function generateSEF(options: ResolvedBuildOptions): string {
    const { config, rootDir, mode } = options;
    const content = [];

    const requiredFiles: {
        header: string,
        content: string,
    }[] = [
        {
            header: "extension_name",
            content: config.name,
        },
        {
            header: "extension_info",
            content: config.info,
        },
        {
            header: "extension_version",
            content: config.version,
        },
    ]

    for (const field of requiredFiles) {
        content.push(
            `[${field.header}]`,
            field.content,
            "",
        );
    }

    const external = readOptionalFile(config.external);
    content.push(
        "[insert_external]",
        external
            ? `\
<div id="${config.id}-external">
${external}
</div>`.trim()
            : "",
        ""
    );

    content.push(
        "[insert_command]",
        hasDefaultExportFallback(options)
            ? `${GLOBAL_NAME}['${config.id}'].default()`
            : "",
        "",
    );
    content.push(
        "[insert_hook]",
        "", // TODO: maybe add hook retro-compatibility
        "",
    );

    const jsScript = fs.readFileSync(path.join(rootDir, config.out.dir, config.out.js), "utf-8");
    content.push(
        "[insert_script]",
        jsScript,
        "",
    );

    let over = readOptionalFile(config.over);
    if (over && mode === BuildMode.production) {
        over = JSON.stringify(JSON.parse(over));
    }
    content.push(
        "[insert_over]",
        over && over != "{}"
            ? over
            : "",
        "",
    );
    return content.join("\n");
}

function generatePreview(options: ResolvedBuildOptions): string {
    const { config, rootDir } = options;

    const external = readOptionalFile(config.external);
    const js_script = fs.readFileSync(path.join(rootDir, config.out.dir, config.out.js), "utf-8");
    return fs
        .readFileSync(path.join(SAMMI_NEXT_PACKAGE_DIR, ".sammi", "preview.blueprint.html"), "utf-8")
        .replace(/{{EXTERNAL}}/g, external ? `<div id="${config.id}-external">${external}</div>` : "")
        .replace(/{{SCRIPT}}/g, js_script);
}

export function mergeBuilderOptions(options: BuildOptions) {
    const { config, rootDir, mode } = options;

    const default_build_config: TsdownConfig = {
        entry: [config.entry],
        outDir: path.join(rootDir, config.out.dir),
        platform: 'browser',
        format: 'iife',
        target: ['es2022'],
        sourcemap: false,
        minify: mode === BuildMode.production,
        banner: {
            js: `/* ${config.name} v${config.version} - Built with SAMMI Next v${VERSION} */`,
        },
        noExternal: ['**'],
        outputOptions: {
            entryFileNames: config.out.js,
            extend: true,
            name: `${GLOBAL_NAME}.${config.id}`,
            exports: 'named',
        },
        inlineOnly: ["**"],
        // customLogger: {
        //     level: config.nextConfig.logLevel === "success" ? "info" : config.nextConfig.logLevel,
        //     error(...args) {
        //         options.logger?.error(args.join(" "));
        //     },
        //     info(...args) {
        //         options.logger?.info(args.join(" "));
        //     },
        //     success(...args) {
        //         options.logger?.success(args.join(" "));
        //     },
        //     warn(...args) {
        //         options.logger?.warn(args.join(" "));
        //     },
        //     warnOnce(...args) {
        //         options.logger?.warnOnce(args.join(" "));
        //     },
        //     clearScreen(type) {
        //         options.logger?.clearScreen(LogLevel[type]);
        //     },
        // }
        // plugins: [
        //     nodePolyfills(),
        // ],
    };
    return lodash.merge(default_build_config, options.config.tsdownConfig);
}

async function buildOnce(options: ResolvedBuildOptions) {
    const { config, rootDir, logger } = options;

    const startTime = Date.now();
    const bundle = await build(options.config.tsdownConfig);
    const tsdownTime = Date.now();
    logger.success(`built ${config.out.js} in ${displayTime(tsdownTime - startTime)}`);

    fs.writeFileSync(path.join(rootDir, config.out.dir, config.out.sef), generateSEF(options), 'utf-8');
    const sefTime = Date.now();
    logger.success(`built ${config.out.sef} in ${displayTime(sefTime - tsdownTime)}`);

    fs.writeFileSync(path.join(rootDir, config.out.dir, "preview.html"), generatePreview(options), 'utf-8');
    const previewTime = Date.now();
    logger.success(`built preview.html in ${displayTime(previewTime - sefTime)}`);
    return { bundle, startTime };
}

export async function buildExtension(options: ResolvedBuildOptions) {
    const { config, mode, logger } = options;

    logger.info(
        colors.cyan(
            `SAMMI Next v${VERSION} ${colors.green(
                `building "${config.name}" extension in ${BuildMode[mode]} mode...`
            )}`
        )
    );

    let bundle: TsdownBundle[] | undefined;
    let startTime: number | undefined;

    try {
        const res = await buildOnce(options);
        bundle = res.bundle;
        startTime = res.startTime;

        if (!config.nextConfig.watch)
            return bundle;

        logger.info("watching for file changes...");

        const watchPaths = [
            path.dirname(config.entry),
            config.external,
            config.over,
        ].filter(Boolean);

        const watcher = chokidar.watch(watchPaths, { ignoreInitial: true });
        let timer: NodeJS.Timeout | null = null;

        watcher.on('all', (event, p) => {
            logger.info(`${event}: ${p}`);
            if (timer)
                clearTimeout(timer);

            timer = setTimeout(() => {
                buildOnce(options).then(res => {
                    bundle = res.bundle;
                    startTime = res.startTime;
                }).catch((e: Error) => logger.error(e.stack || e.message, { error: e }));
            }, 100);
        });

        process.on('SIGINT', () => {
            logger.info("Stopping watch mode...");
            watcher
                .close()
                .then(() => process.exit(0))
                .catch((e: Error) => {
                    logger.error(e.stack || e.message, { error: e });
                    process.exit(1);
                });
        });
        return watcher;
    } catch (error) {
        if (startTime) {
            logger.error(`Build failed in ${displayTime(Date.now() - startTime)}`);
            startTime = undefined;
        }
        throw error;
    }
}
