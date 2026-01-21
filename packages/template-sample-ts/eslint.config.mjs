import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import sammiNext from 'eslint-plugin-sammi-next';
import extension_config from './sammi.config.json' with { type: "json" };

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
        files: [extension_config.entry],
        extends: [
            sammiNext.configs.requiredEntry,
        ]
    },
    {
        main: "javascript files",
        files: ["**/*.{js,mjs,cjs}"],
        extends: [
            tseslint.configs.recommended,
        ],
    },
    {
        main: "typescript files",
        files: ["**/*.{ts,mts,cts}"],
        extends: [
            tseslint.configs.stylistic,
            tseslint.configs.recommendedTypeChecked
        ]
    },
    {
        rules: {
            'no-unused-vars': [
                'error',
                { varsIgnorePattern: '^[A-Z_]' }
            ],
            "@typescript-eslint/no-explicit-any": [
                "warn",
                { fixToUnknown: true },
            ]
        },
    },
    globalIgnores([
        "node_modules",
        "dist",
        "eslint.config.*",
        "sammi.config.*",
        "build.ts",
    ])
]);
