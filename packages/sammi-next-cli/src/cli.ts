import { cac } from 'cac';
import { BuildEnvironmentOptions, createBuilder } from './build';
import { InlineConfig } from './config';
import { createLogger, LogTypes } from './logger';
import colors from 'picocolors';

const cli = cac('sammi-next');

interface GlobalCLIOptions {
    c?: string
    config?: string
    l?: LogTypes
    logLevel?: LogTypes
    clearScreen?: boolean
    m?: string
    mode?: string
    w?: boolean
}

const filterDuplicateOptions = <T extends object>(options: T) => {
    for (const [key, value] of Object.entries(options)) {
        if (!Array.isArray(value)) continue;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        options[key as keyof T] = value[value.length - 1];
    }
}

function cleanGlobalCLIOptions<Options extends GlobalCLIOptions>(
    options: Options,
): Omit<Options, keyof GlobalCLIOptions> {
    const ret = { ...options };
    delete ret.c
    delete ret.config
    delete ret.m
    delete ret.mode
    delete ret.w

    if ('watch' in ret) {
        ret.watch = ret.watch ? {} : undefined;
    }

    return ret;
}

cli
    .option('-c, --config <file>', '[string] use specified config file')
    .option('-m, --mode <mode>', '[string] set env mode')

cli
    .command('[root]', 'build extension')
    .option('--outDir <dir>', '[string] output directory (default: dist)')
    .option('--outJs <name>', '[string] output file name for the JS (default: extension.js)')
    .option('--outSef <name>', '[string] output file name for the SEF (default: extension.sef)')
    .option('--minify', '[boolean] enable/disable minification (default: true)')
    .option('-w, --watch', '[boolean] rebuilds when files have changed on disk')
    .action(
        async (
            root: string,
            options: GlobalCLIOptions
        ) => {
            filterDuplicateOptions(options);

            const buildOptions: BuildEnvironmentOptions = cleanGlobalCLIOptions(options);

            try {
                const inlineConfig: InlineConfig = {
                    root,
                    mode: options.mode,
                    configFile: options.config,
                    logLevel: options.logLevel,
                    clearScreen: options.clearScreen,
                    build: buildOptions,
                }
                const builder = await createBuilder(inlineConfig);
                await builder.buildApp();
            } catch (e) {
                const error = e as Error;
                createLogger(options.logLevel).error(
                    colors.red(`error during build:\n${error.stack}`),
                    { error },
                );
                process.exit(1);
            }
        }
    )
