import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: {
        'runtime/index': 'src/runtime/index.ts',

        'shared/config-types': 'src/shared/config-types.ts',

        'node/cli': 'src/node/cli.ts',
        'node/build': 'src/node/build.ts',
        'node/config': 'src/node/config.ts',
    },
    target: 'es2022',
    format: 'esm',
    sourcemap: true,
    dts: true,

    external: [
        'fs',
        'path',
        'node:fs',
        'node:path',
        'node:url',
        'chokidar',
        'tsdown',
        'jiti',
        'ajv',
    ],
});
