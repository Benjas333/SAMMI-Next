import cac from "cac";
import { buildExtension, BuildMode, BuildModes } from "./build";
import colors from 'picocolors';
import { resolveBuildConfig } from "./config";

const cli = cac('sammi-next');

export interface GlobalCLIOptions {
    m?: string
    mode?: string
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
    delete ret.m
    delete ret.mode

    return ret;
}

cli.option('-m, --mode <mode>', '[string] set build mode');

export interface BuildCLIOptions {
    outDir?: string
    outJs?: string
    outSef?: string
}

cli
    .command('[root]', 'build extension')
    .option('--outDir <dir>', '[string] output directory (default: "dist")')
    .option('--outJs <name>', '[string] output file name for the JS (default: extension.js)')
    .option('--outSef <name>', '[string] output file name for the SEF (default: extension.sef)')
    .action(
        async (
            root: string,
            options: GlobalCLIOptions,
        ) => {
            filterDuplicateOptions(options);

            const buildOptions: BuildCLIOptions = cleanGlobalCLIOptions(options);
            const mode = BuildModes.findIndex(m => {
                return m.toLowerCase() === (options.mode || BuildMode[BuildMode.PRODUCTION]).toLowerCase();
            });
            if (mode < 0) {
                console.error(`Invalid mode: ${options.mode}. It must be one of: ${BuildModes.join(', ')}`);
                process.exit(1);
            }

            try {
                const buildConfig = await resolveBuildConfig(
                    root,
                    mode,
                    buildOptions,
                );

                await buildExtension(buildConfig);
            } catch (e) {
                const error = e as Error;
                console.error(colors.red(`error during build:\n${error.stack}`));
                process.exit(1);
            }
        }
    )

cli
    .command('dev [root]', 'build extension in dev mode')
    .option('--outDir <dir>', '[string] output directory (default: "dist")')
    .option('--outJs <name>', '[string] output file name for the JS (default: extension.js)')
    .option('--outSef <name>', '[string] output file name for the SEF (default: extension.sef)')
    .action(
        async (
            root: string,
            options: GlobalCLIOptions,
        ) => {
            filterDuplicateOptions(options);

            const buildOptions: BuildCLIOptions = cleanGlobalCLIOptions(options);
            const mode = BuildModes.findIndex(m => {
                return m.toLowerCase() === (options.mode || BuildMode[BuildMode.DEV]).toLowerCase();
            });
            if (mode < 0) {
                console.error(`Invalid mode: ${options.mode}. It must be one of: ${BuildModes.join(', ')}`);
                process.exit(1);
            }

            try {
                const buildConfig = await resolveBuildConfig(
                    root,
                    mode,
                    buildOptions,
                );

                await buildExtension(buildConfig);
            } catch (e) {
                const error = e as Error;
                console.error(colors.red(`error during build:\n${error.stack}`));
                process.exit(1);
            }
        }
    )
