/// <reference types="sammi-bridge-types" />
import type { ExtensionConfig, SAMMINextExtension } from "./types";

window.SAMMIExtensions ??= {};
const PROXY_PREFIX = "[SAMMI-NEXT-PROXY]";

interface initExtensionOptions {
    /**
     * Whether to skip the process of proxying your extension.
     *
     * Warning: this allows other scripts to modify your exports.
     *
     * @default false
     */
    skipProxying?: boolean
}
const defaultInitExtensionOptions: initExtensionOptions = {
    skipProxying: false,
}
/**
 * Removes unnecessary data from a raw extension config object and parses it into an ExtensionConfig.
 *
 * Exports the config through the `SAMMIExtensions` namespace with the `_config` key.
 *
 * Generates a Proxy of the extension object to avoid other scripts trying to overwrite it.
 *
 * @example
 * const extension_config = SAMMIExtensions['extension-id']._config;
 *
 * @param config Unparsed config object.
 * @param options Whether to skip the process of proxying your extension (allowing other scripts to modify your exports).
 * @returns Parsed and cleaned config.
 */
export function initExtension(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: Record<string, any>,
    options: Omit<initExtensionOptions, 'skipProxying'> & {
        skipProxying: true
    },
): ExtensionConfig
export function initExtension(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: Record<string, any>,
    options?: Omit<initExtensionOptions, 'skipProxying'> & {
        skipProxying: false
    },
): Readonly<ExtensionConfig>
export function initExtension(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: Record<string, any>,
    options?: initExtensionOptions
): Readonly<ExtensionConfig> | ExtensionConfig {
    let response: ExtensionConfig = {
        id: config.id as string,
        name: config.name as string,
        version: config.version as string,
        info: config.info as string | undefined,
    };

    window.SAMMIExtensions = window.SAMMIExtensions || {};
    SAMMIExtensions[response.id] = SAMMIExtensions[response.id] || {};
    if (SAMMIExtensions[response.id]?._config)
        throw new Error('The extension with the provided id was already initialized');

    const settings = Object.assign(defaultInitExtensionOptions, options);
    if (!settings.skipProxying)
        response = Object.freeze(response);

    // @ts-expect-error This is before proxying the extension, so no error.
    SAMMIExtensions[response.id]!._config ??= response;
    if (settings.skipProxying) return response;

    SAMMIExtensions[response.id] = new Proxy(SAMMIExtensions[response.id]!, {
        set(target, prop) {
            console.error(PROXY_PREFIX, ": Blocked setting value of:", prop, "on:", target._config?.id);
            return true;
        },
        defineProperty(target, property) {
            console.error(PROXY_PREFIX, ": Blocked property redefinition of:", property, "on:", target._config?.id);
            return true;
        },
        deleteProperty(target, p) {
            console.error(PROXY_PREFIX, ": Blocked deletion of:", p, "on:", target._config?.id);
            return true;
        },
        setPrototypeOf(target) {
            console.error(PROXY_PREFIX, ": Blocked changing prototype of:", target._config?.id);
            return true;
        },
    });
    return response;
}

/**
 * Retrieves an [insert_external] section by its extension id.
 *
 * ### Original documentation from https://sammi.solutions/extensions/build
 * This section appears inside the extension’s tab in Bridge, and it provides a visual interface for the extension if needed. It’s written in HTML and CSS.
 *
 * @example
 * const EXTERNAL = getExternalSection(config.id);
 * EXTERNAL.querySelector("button")?.addEventListener('click', () => console.log('Hello world!'));
 *
 * @param extension_id The id of the SAMMI Next extension to retrieve its [insert_external] section.
 * @returns the div element that wraps your extension.
 */
export function getExternalSection(extension_id: string): HTMLDivElement {
    return document.getElementById(`${extension_id}-external`) as HTMLDivElement;
}

interface insertCommandSectionOptions {
    /**
     * Whether to wait for `sammiclient` to exist.
     * This is enabled by default because every extension that uses `SAMMI` depends on `sammiclient`.
     * You can disable it if your [insert_command] section doesn't use neither `SAMMI` nor `sammiclient`.
     *
     * @default true
     */
    waitForSammiclient?: boolean;
    /**
     * Whether to wait for `SAMMIExtensions` to exist.
     * You must set this to `true` if you use the `SAMMIExtensions` namespace inside your [insert_command] section.
     *
     * @default false
     */
    waitForSAMMIExtensions?: boolean;
}
const defaultInsertCommandSectionOptions: insertCommandSectionOptions = {
    waitForSammiclient: true,
    waitForSAMMIExtensions: false,
}
/**
 * Generates your [insert_command] section.
 * This should be used in the default export of your extension.
 *
 * By default, it wraps your callback to wait for `sammiclient` and `SAMMI` are initialized.
 * Its behavior can be changed in the options param.
 *
 * ### Original documentation from https://sammi.solutions/extensions/build
 * In this section, you can define Extension Commands.
 * These commands will be available to users in SAMMI Core when they install your extension.
 * You can define multiple commands in this section.
 * Refer to the SAMMI Bridge documentation for Extension Command details.
 * In this section, you can also automatically call your main extension function that should run as soon as SAMMI connects to Bridge.
 *
 * @example
 * export default insertCommandSection(() => {
 *     SAMMI.extCommand("Extension Sample Command", 3355443, 52).catch(e => console.error(e));
 *     sammiclient.on("Extension Sample Command", () => {
 *         const handler = async () => {
 *             await SAMMI.notification('Command Sample');
 *         };
 *         handler().catch((e) => console.error(e));
 *     });
 * });
 * export default insertCommandSection(
 *     () => console.log("Hello world"),
 *     { waitForSammiclient: false }
 * );
 * export default insertCommandSection(
 *     () => console.log(SAMMIExtensions["extension-id"]),
 *     { waitForSAMMIExtensions: true }
 * );
 *
 * @param callback A callback with the logic that you will insert in your [insert_command] section.
 * @param options The initialization options.
 * @returns wrapped export default callback
 */
export function insertCommandSection(
    callback: () => void,
    options?: insertCommandSectionOptions,
): () => void {
    const settings = Object.assign(defaultInsertCommandSectionOptions, options);

    const wrapper = () => {
        if (!sammiclient && settings.waitForSammiclient) {
            setTimeout(wrapper, 0);
            return;
        }

        if (!SAMMIExtensions && settings.waitForSAMMIExtensions) {
            setTimeout(wrapper, 0);
            return;
        }

        callback();
    };

    return wrapper;
}

export type { ExtensionConfig as FullExtensionConfig } from '@shared/config-types';
export type { ExtensionConfig, SAMMINextExtension };
