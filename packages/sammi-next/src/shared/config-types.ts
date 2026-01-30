import type { InlineConfig as TsdownConfig } from "tsdown";
import { Logger, LogLevelKey } from "./logger-types";
import type { BuildModeKey } from "./build-types";

export interface NextConfig {
    /**
     * Explicitly set a mode to run in.
     * This will override the default mode for each command, and can be overridden by the command line --mode option.
     */
    mode?: BuildModeKey

    /**
     * Log level.
     *
     * @default 'info'
     */
    logLevel?: LogLevelKey

    /**
     * Custom logger.
     */
    customLogger?: Logger

    /**
     * @default true
     */
    clearScreen?: boolean

    /**
     * Rebuilds when files have changed on disk.
     * This can be overridden by the command line --watch option.
     *
     * @default false
     */
    watch?: boolean
}

export interface ResolvedNextConfig extends Required<
    Omit<
        NextConfig,
        | 'mode'
        | 'customLogger'
    >
> {
    mode: NextConfig['mode'];

    customLogger: NextConfig['customLogger'];
}

export interface AuthorInfo {
    name: string,
    url?: string,
    email?: string,
}

/**
 * Represents the full extension config from sammi.config.ts.
 * Used by the CLI to build the extension.
*/
export interface ExtensionConfig {
    /**
     * Specify a unique id for your extension here.
     * Please use alphanumeric characters, dashes, and underscores only.
     *
     * @origin SAMMI Next
     */
    id: string;

    /**
     * This section names your extension, and is visible in SAMMI Bridge and SAMMI Core.
     * Please use alphanumeric characters and spaces only.
     */
    name: string;

    /**
     * This section is for descriptive text about the extension, e.g. what the extension does.
     * This information is displayed to the users in SAMMI Bridge-Extensions tab when they hover
     * over the extension name inside the list of installed extensions.
     *
     * @default ""
     */
    info?: string;

    /**
     * Specify your extension version here, using numbers and dots (e.g., 2.01).
     * This is crucial for the automatic version checker in Bridge, which can notify users of updates.
     *
     * Note: the regex pattern used for validation is `^\d+(?:\.\d+)*(?:-.*)?$`.
     * Although SAMMI Next allows beta/alpha suffixes due to its RegExp,
     * please note that the official SAMMI Bridge automatic version checker ignores them.
     * In other words, the users only will be notified of release updates.
     */
    version: string;

    /**
     * Specify a person who has been involved in creating or maintaining this extension.
     *
     * Optional, purely informational. Neither SAMMI Bridge, nor SAMMI Next, nor tsdown use this field.
     *
     * @origin SAMMI Next
     * @default undefined
     */
    author?: string | AuthorInfo | (string | AuthorInfo)[];

    /**
     * Specify your script.ts path here.
     * In your [insert_script] section, you’re encouraged to write your own TypeScript code.
     *
     * @origin SAMMI Next
     * @internal
     */
    entry: string;

    /**
     * Specify your external.html path here.
     * Your [insert_external] section appears inside the extension’s tab in Bridge,
     * and it provides a visual interface for the extension if needed. It’s written in HTML and CSS.
     *
     * @origin SAMMI Next
     * @internal
     * @default undefined
     */
    external?: string;

    /**
     * Specify your over.json path here.
     * In your [insert_over] section you simply copy and paste your deck from SAMMI Core you wish to distribute with your extension.
     * When users install your extension, the deck will be automatically added to their SAMMI Core.
     *
     * @origin SAMMI Next
     * @internal
     * @default undefined
     */
    over?: string;

    /**
     * Configuration related with the extension building.
     *
     * @origin SAMMI Next
     * @internal
     */
    out?: {
        /**
         * The path where the extension will build to.
         *
         * @origin SAMMI Next
         * @internal
         * @default "dist"
         */
        dir?: string;

        /**
         * The file name of the final JavaScript file.
         *
         * @origin SAMMI Next
         * @internal
         * @default "extension.js"
         */
        js?: string;

        /**
         * The file name of the final SAMMI Extension File.
         *
         * @origin SAMMI Next
         * @internal
         * @default "extension.sef"
         */
        sef?: string;
    },

    /**
     * Additional config for SAMMI Next.
     *
     * @origin SAMMI Next
     * @internal
     * @default undefined
    */
    nextConfig?: NextConfig

    /**
     * Overrides the tsdown building config.
     *
     * **Use with caution; ensure you understand the implications.**
     *
     * @origin tsdown
     * @internal
     * @default undefined
     */
    tsdownConfig?: TsdownConfig,
}

/**
 * Helper function to define a SAMMI Next extension config with type safety.
 *
 * @example
 * ```ts
 * // sammi.config.ts
 * import { defineConfig } from 'sammi-next/config';
 *
 * export default defineConfig({
 *     id: 'my-extension',
 *     name: 'My Extension',
 *     version: '1.0.0',
 *     entry: 'src/script.ts',
 * });
 * ```
 */
export function defineConfig(config: ExtensionConfig): ExtensionConfig {
    return config;
}

/**
 * Resolved extension config with defaults applied.
 * Used internally by the builder.
 *
 * @internal
 */
export interface ResolvedExtensionConfig extends Required<
    Omit<
        ExtensionConfig,
        | 'out'
        | 'author'
        | 'nextConfig'
    >
> {
    out: Required<NonNullable<ExtensionConfig['out']>>;

    author?: ExtensionConfig['author'];

    nextConfig: ResolvedNextConfig;
}
