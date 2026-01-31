import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default defineConfig([
    eslint.configs.recommended,
    ...tseslint.configs.stylistic,
    {
        name: 'main',
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 2022,
                isolatedDeclarations: true,
                // project: [
                //     "packages/*/tsconfig.json"
                // ],
                tsconfigRootDir: import.meta.dirname,
                projectService: {
                    allowDefaultProject: ["*.config.*"],
                    // defaultProject: "tsconfig.json"
                },
            },
        }
    },
    {
        name: "javascript files",
        files: ["**/*.{js,mjs,cjs}"],
        extends: [
            tseslint.configs.recommended,
        ]
    },
    {
        name: "typescript files",
        files: ["**/*.{ts,mts,cts}"],
        extends: [
            tseslint.configs.recommendedTypeChecked
        ]
    },
    {
        rules: {
            "@typescript-eslint/no-explicit-any": [
                "warn",
                { fixToUnknown: true },
            ]
        }
    },
    globalIgnores([
        "node_modules/**/*",
        'packages/create-sammi-next/template-*',
        '**/dist/**',
        '**/lib/**',
        '**/bin/**',
        '**/temp/**',
        'vendor/**/*',
        // '**/*.d.ts',
        'eslint.config.*',
    ]),
]);
