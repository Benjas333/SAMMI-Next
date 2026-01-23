import { defineConfig } from 'sammi-next/config'

export default defineConfig({
    id: "{{EXTENSION_ID}}",
    name: "{{EXTENSION_NAME}}",
    info: "",
    version: "0.0.1",
    entry: "src/script.js",
    external: "src/external.html",
    over: "src/over.json",
    out: {
        dir: "dist",
        js: "extension.js",
        sef: "extension.sef",
    },
});
