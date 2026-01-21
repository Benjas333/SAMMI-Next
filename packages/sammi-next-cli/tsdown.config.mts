import path from "node:path";
import { defineConfig } from "tsdown";

export default defineConfig({
    entry: {
        // index: path.resolve(__dirname, 'src/index.ts'),
        cli: path.resolve(__dirname, 'src/cli.ts'),
    },
    fixedExtension: false,
    minify: true
});
