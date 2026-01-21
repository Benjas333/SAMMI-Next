
/**
 * Represents useful data from the sammi.config.json. Friendly to export.
 */
export interface ExtensionConfig {
    /** This section names your extension, and is visible in SAMMI Bridge and SAMMI Core. Please use alphanumeric characters and spaces only. */
    name: string;
    /** Specify a unique id for your extension here. Please use alphanumeric characters, dashes, and underscores only. */
    id: string;
    /** This section is for descriptive text about the extension, e.g. what the extension does. This information is displayed to the users in SAMMI Bridge-Extensions tab when they hover over the extension name inside the list of installed extensions. */
    info?: string;
    /** Specify your extension version here, using numbers and dots (e.g., 2.01). This is crucial for the automatic version checker in Bridge, which can notify users of updates. */
    version: string;
}

/**
 * Interface that represents most of the structures built with SAMMI Next.
 */
export interface SAMMINextExtension {
    readonly default?: () => void;
    readonly _config?: ExtensionConfig;
    readonly [key: string]: unknown;
}
