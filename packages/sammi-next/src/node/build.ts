import fs from 'node:fs';
import path from 'node:path';
import colors from 'picocolors';
import chokidar from 'chokidar';
import { ResolvedExtensionConfig } from "@shared/config-types";
import { build, TsdownBundle } from "tsdown";
import { BUILD_PREFIX, GLOBAL_NAME, GREEN_CHECK, RED_X, SAMMI_NEXT_PACKAGE_DIR, VERSION } from "./constants";
import { displayTime } from './utils';

export enum BuildMode {
    DEV,
    PRODUCTION,
}

export const BuildModes = Object.keys(BuildMode).filter(key => isNaN(Number(key)));

export interface BuildOptions {
    config: ResolvedExtensionConfig;
    rootDir: string;
    mode?: BuildMode;
}

export type ResolvedBuildOptions = Required<BuildOptions>;

function readOptionalFile(path: string): string | undefined {
    if (!fs.existsSync(path)) return;

    return fs.readFileSync(path, 'utf-8');
}

const CommandRE = /\w+\(\w+,\s*{\s*default:/gm;

function generateSEF(options: ResolvedBuildOptions): string {
    const { config, mode } = options;
    const content = [];

    const required_files: {
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

    for (const field of required_files) {
        content.push(`[${field.header}]`, field.content, "");
    }

    const external = readOptionalFile(config.external);
    content.push("[insert_external]", external ? `<div id="${config.id}-external">${external}</div>` : "", "");

    const script = fs.readFileSync(config.entry, "utf-8");
    content.push("[insert_command]", CommandRE.test(script) ? `${GLOBAL_NAME}.${config.id}.default()` : "", "");
    content.push("[insert_hook]", "", "") // TODO: maybe add hook retro-compatibility
    content.push("[insert_script]", script, "");

    let over = readOptionalFile(config.over);
    if (over && mode === BuildMode.PRODUCTION) {
        over = JSON.stringify(JSON.parse(over));
    }
    content.push("[insert_over]", over && over != "{}" ? over : "", "");
    return content.join("\n");
}

function generatePreview(options: ResolvedBuildOptions): string {
    const { config } = options;

    const external = readOptionalFile(config.external);
    const script = fs.readFileSync(config.entry, "utf-8");
    return fs
        .readFileSync(path.join(SAMMI_NEXT_PACKAGE_DIR, ".sammi", "preview.blueprint.html"), "utf-8")
        .replace(/{{EXTERNAL}}/g, external ? `<div id="${config.id}-external">${external}</div>` : "")
        .replace(/{{SCRIPT}}/g, script);
}

async function buildOnce(options: ResolvedBuildOptions) {
    const { config, rootDir, mode } = options;

    const startTime = Date.now();
    const bundle = await build({
        entry: [config.entry],
        outDir: path.join(rootDir, config.out.dir),
        platform: 'browser',
        format: 'iife',
        target: ['es2022'],
        sourcemap: false,
        minify: mode === BuildMode.PRODUCTION,
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
    });
    const tsdownTime = Date.now();
    console.info(GREEN_CHECK, BUILD_PREFIX, `built ${config.out.js} in ${displayTime(tsdownTime - startTime)}`);

    fs.writeFileSync(path.join(rootDir, config.out.dir, config.out.sef), generateSEF(options), 'utf-8');
    const sefTime = Date.now();
    console.info(GREEN_CHECK, BUILD_PREFIX, `built ${config.out.sef} in ${displayTime(sefTime - tsdownTime)}`);

    fs.writeFileSync(path.join(rootDir, config.out.dir, "preview.html"), generatePreview(options), 'utf-8');
    const previewTime = Date.now();
    console.info(GREEN_CHECK, BUILD_PREFIX, `built preview.html in ${displayTime(previewTime - sefTime)}`);
    return { bundle, startTime };
}

export async function buildExtension(options: ResolvedBuildOptions) {
    const { config, mode } = options;

    console.info(
        colors.cyan(
            `SAMMI Next v${VERSION} ${colors.green(
                `building "${config.name}" extension in ${BuildMode[mode].toLowerCase()} mode...`
            )}`
        ),
    );

    let bundle: TsdownBundle[] | undefined;
    let startTime: number | undefined;

    try {
        const res = await buildOnce(options);
        bundle = res.bundle;
        startTime = res.startTime;

        if (options.mode !== BuildMode.DEV) return bundle;

        console.info(BUILD_PREFIX, colors.cyan("watching for file changes..."));

        const watchPaths = [
            path.dirname(config.entry),
            config.external,
            config.over,
        ].filter(Boolean);

        const watcher = chokidar.watch(watchPaths, { ignoreInitial: true });
        let timer: NodeJS.Timeout | null = null;

        watcher.on('all', (event, p) => {
            console.info(colors.cyan(`${event}: ${p}`));
            if (timer)
                clearTimeout(timer);

            timer = setTimeout(() => {
                buildOnce(options).then(res => {
                    bundle = res.bundle;
                    startTime = res.startTime;
                }).catch(e => console.error(e));
            }, 100);
        });

        process.on('SIGINT', () => {
            console.info("\nStopping watch mode...");
            watcher
                .close()
                .then(() => process.exit(0))
                .catch(e => {
                    console.error(e);
                    process.exit(1);
                });
        });
        return watcher;
    } catch (error) {
        if (startTime) {
            console.error(RED_X, BUILD_PREFIX, `Build failed in ${displayTime(Date.now() - startTime)}`);
            startTime = undefined;
        }
        throw error;
    }
}
