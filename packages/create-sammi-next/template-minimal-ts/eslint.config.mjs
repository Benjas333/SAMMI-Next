import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import pluginImport from 'eslint-plugin-import';
import sdl from '@microsoft/eslint-plugin-sdl';
import sammiNext from 'eslint-plugin-sammi-next';
import extensionConfig from './sammi.config.ts'

export default defineConfig([
    js.configs.recommended,
    {
        name: "main",
        languageOptions: {
            parserOptions: {
                // projectService: true,
                projectService: {
                    allowDefaultProject: ['eslint.config.*'],
                    defaultProject: "tsconfig.json",
                },
                tsconfigRootDir: import.meta.dirname,
                sourceType: 'module',
            },
        },
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
            tseslint.configs.recommended,
        ],
    },
    {
        name: "typescript files",
        files: ["**/*.{ts,mts,cts}"],
        extends: [
            tseslint.configs.stylistic,
            tseslint.configs.recommendedTypeChecked
        ],
    },
    {
        name: "general rules",
        rules: {
            'no-unused-vars': [
                'error',
                { varsIgnorePattern: '^[A-Z_]' }
            ],
            "@typescript-eslint/no-explicit-any": [
                "warn",
                { fixToUnknown: true },
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
