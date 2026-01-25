import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import pluginImport from 'eslint-plugin-import';
import sdl from '@microsoft/eslint-plugin-sdl';
import globals from "globals";
import sammiNext from 'eslint-plugin-sammi-next';
import extensionConfig from './sammi.config.js';

export default defineConfig([
    {
        name: "main",
        languageOptions: {
            globals: {
                ...globals.browser,
                'SAMMI': true,
                'sammiclient': true,
                'SAMMIExtensions': true,
            }
        }
    },
    {
        name: "sammi next entry script",
        files: [extensionConfig.entry],
        extends: [
            sammiNext.configs.requiredEntry,
        ]
    },
    {
        name: "javascript files",
        files: ["**/*.{js,mjs,cjs}"],
        extends: [
            js.configs.recommended,
        ],
    },
    {
        name: "general rules",
        rules: {
            'no-unused-vars': [
                'error',
                { varsIgnorePattern: '^[A-Z_]' }
            ],
        },
    },
    {
        name: "import rules",
        plugins: {
            import: pluginImport
        },
        rules: {
            'import/no-nodejs-modules': 'error',
            'import/no-deprecated': 'error',
            'import/no-extraneous-dependencies': 'error',
            'import/export': 'error',
        },
    },
    {
        name: "@microsoft/sdl rules",
        plugins: {
            "@microsoft/sdl": sdl
        },
        rules: {
            "@microsoft/sdl/no-document-write": "warn",
            "@microsoft/sdl/no-inner-html": "warn",
        },
    },
    globalIgnores([
        "node_modules",
        "dist",
        "eslint.config.*",
        "sammi.config.*",
    ])
]);
