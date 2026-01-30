import cac from "cac";
import { buildExtension } from "./build";
import colors from 'picocolors';
import { VERSION } from "./constants";
import { createLogger } from "./logger";
import { resolveConfig } from "./config";
import { LogLevel, LogLevelKey } from "@shared/logger-types";
import { BuildModeKey } from "@shared/build-types";

const cli = cac('sammi-next');

export interface GlobalCLIOptions {
    '--'?: string[]
    c?: boolean | string
    config?: string
    l?: LogLevelKey
    logLevel?: LogLevelKey
    clearScreen?: boolean
    m?: BuildModeKey
    mode?: BuildModeKey
}

const filterDuplicateOptions = <T extends object>(options: T) => {
    for (const [key, value] of Object.entries(options)) {
        if (!Array.isArray(value)) continue;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        options[key as keyof T] = value[value.length - 1];
    }
};

function cleanGlobalCLIOptions<Options extends GlobalCLIOptions>(options: Options): Omit<Options, keyof GlobalCLIOptions> {
    const ret = { ...options };
    delete ret['--']
    delete ret.c
    delete ret.config
    delete ret.l
    delete ret.logLevel
    delete ret.clearScreen
    delete ret.m
    delete ret.mode

    return ret;
}

cli
    .option('-c, --config <file>', '[string] use specified config file')
    .option('-l, --logLevel <level>', '[string] info | success | warn | error | silent')
    .option('--clearScreen', '[boolean] allow/disable clear screen when logging')
    .option('-m, --mode <mode>', '[string] set build mode');

export interface BuilderCLIOptions {
    outDir?: string
    outJs?: string
    outSef?: string
    w?: boolean
    watch?: boolean
}

cli
    .command('[root]', 'build extension')
    .alias('build')
    .option('--outDir <dir>', '[string] output directory (default: "dist")')
    .option('--outJs <name>', '[string] output file name for the JS (default: "extension.js")')
    .option('--outSef <name>', '[string] output file name for the SEF (default: "extension.sef")')
    .option('-w, --watch', '[boolean] rebuilds when files have changed on disk')
    .action(
        async (
            root: string | undefined,
            options: GlobalCLIOptions & BuilderCLIOptions,
        ) => {
            filterDuplicateOptions(options);

            const buildOptions: BuilderCLIOptions = cleanGlobalCLIOptions(options);

            try {
                const buildConfig = await resolveConfig(
                    root,
                    "production",
                    options,
                    buildOptions,
                );

                await buildExtension(buildConfig);
            } catch (e) {
                const error = e as Error;
                createLogger(LogLevel[options.logLevel ?? "info"]).error(
                    colors.red(`error during build::\n${error.stack}`),
                    { error },
                )
                process.exit(1);
            }
        }
    )

cli
    .command('dev [root]', 'build extension in dev mode (without minification)')
    .option('--outDir <dir>', '[string] output directory (default: "dist")')
    .option('--outJs <name>', '[string] output file name for the JS (default: "extension.js")')
    .option('--outSef <name>', '[string] output file name for the SEF (default: "extension.sef")')
    .option('-w, --watch', '[boolean] rebuilds when files have changed on disk')
    .action(
        async (
            root: string | undefined,
            options: GlobalCLIOptions & BuilderCLIOptions,
        ) => {
            filterDuplicateOptions(options);

            const buildOptions: BuilderCLIOptions = cleanGlobalCLIOptions(options);

            try {
                const buildConfig = await resolveConfig(
                    root,
                    "dev",
                    options,
                    buildOptions,
                );

                await buildExtension(buildConfig);
            } catch (e) {
                const error = e as Error;
                createLogger(LogLevel[options.logLevel ?? "info"]).error(
                    colors.red(`error during build::\n${error.stack}`),
                    { error },
                )
                process.exit(1);
            }
        }
    )

cli.help();
cli.version(VERSION);

cli.parse();
