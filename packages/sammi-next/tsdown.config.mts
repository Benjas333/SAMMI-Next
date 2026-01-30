import { defineConfig } from 'tsdown';
import nodePolyfills from '@rolldown/plugin-node-polyfills';

export default defineConfig([
    {
        entry: {
            'browser/index': 'src/browser/index.ts',

            'shared/config-types': 'src/shared/config-types.ts',
        },
        platform: 'browser',
        format: 'esm',
        target: 'es2022',
        sourcemap: true,
        dts: true,
        // banner: '/// <reference types="sammi-bridge-types" />',
        // noExternal: ["**"],
        // external: ["events"],
        plugins: [
            nodePolyfills()
        ]
    },
    {
        entry: {
            'node/cli': 'src/node/cli.ts',
            // 'node/build': 'src/node/build.ts',
            // 'node/config': 'src/node/config.ts',
        },
        platform: 'node',
        target: 'es2022',
        format: 'esm',
        sourcemap: true,
        dts: true,

        external: [
            'fs',
            'path',
            'node:*',
            'chokidar',
            'tsdown',
            'jiti',
            'ajv',
            'lodash',
        ],
    },
]);
