import { SAMMINextExtension } from "./types";

declare global {
    /**
     * Global namespace where SAMMI Next stores all the extensions.
     */
    var SAMMIExtensions: Record<string, SAMMINextExtension | undefined>;
}

export {};
