import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ["src/index.ts"],
    target: 'es2022',
    sourcemap: true,
    dts: true,
    outDir: 'lib',
    unbundle: true, // TODO: reconsider not doing this lol
})
