import { defineConfig } from 'sammi-next/config'

export default defineConfig({
    id: "{{EXTENSION_ID}}",
    name: "{{EXTENSION_NAME}}",
    info: "An example of an extension using SAMMI Next",
    version: "0.0.1",
    entry: "src/script.ts",
    external: "src/external.html",
    over: "src/over.json",
    out: {
        dir: "dist",
        js: "extension.js",
        sef: "extension.sef",
    },
});
