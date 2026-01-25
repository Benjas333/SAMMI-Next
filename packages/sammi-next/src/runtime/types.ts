import type { SAMMICommands, SAMMIWebSocket } from 'sammi-bridge-types';
import type { ExtensionConfig as FullExtensionConfig } from "@shared/config-types";

declare global {
    /**
     * Bridge provides native helper functions to make your life easier, without the need to use SAMMI Websocket library directly.
     *
     * You can call all helper functions with SAMMI.method(arguments).
     *
     * To use promises, you can call them with SAMMI.method(arguments).then(response=>console.log(response)).
     */
    const SAMMI: SAMMICommands;

    /**
     * When a user triggers an extension command, SAMMI will send the data to Bridge (unless the `sendAsExtensionTrigger` parameter is set to `true`).
     *
     * You can listen to this data by using `sammiclient.on('extension name', (payload) => {})`.
     *
     * You can also use `sammiclient.addListener('extension name', functionToExecute)`.
     *
     * For example, let's say your extension command is called Lucky Wheel:
     * @example
     * sammiclient.on('Lucky Wheel', (payload) => {
     * console.log(payload)
     *   // DO SOMETHING WITH THE EXTENSION PAYLOAD
     *   // FromButton - button ID the extension command was triggered in
     *   // instanceId - instance ID of a button the extension command was triggered in
     *   const { FromButton, instanceId }  = payload.Data
     * });
     */
    const sammiclient: SAMMIWebSocket;

    /**
     * Namespace that stores extensions built with SAMMI Next.
     */
    var SAMMIExtensions: Record<string, SAMMINextExtension | undefined>;
}

/**
 * Represents useful data from the sammi.config.js.
 */
export interface ExtensionConfig {
    /**
     * Unique id of the extension.
     */
    id: FullExtensionConfig['id'];

    /**
     * Name of the extension. It is visible in SAMMI Bridge and SAMMI Core.
     */
    name: FullExtensionConfig['name'];

    /**
     * Descriptive text about the extension, e.g. what the extension does.
     * Is displayed to the users in SAMMI Bridge-Extensions tab when they hover over the extension name inside the list of installed extensions.
     */
    info: FullExtensionConfig['info'];

    /**
     * Extension version, using numbers and dots (e.g., 2.01).
     * Used by the automatic version checker in Bridge, which can notify users of updates.
     */
    version: FullExtensionConfig['version'];

    /**
     * Specify a person who has been involved in creating or maintaining this extension.
     *
     * @default undefined
     */
    author?: FullExtensionConfig['author'];
}

/**
 * Interface that represents most of the structures built with SAMMI Next.
 */
export interface SAMMINextExtension {
    readonly default?: () => void;
    readonly _config?: ExtensionConfig;
    readonly [key: string]: unknown;
}

export { FullExtensionConfig };
