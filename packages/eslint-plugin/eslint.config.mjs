import { defineConfig } from "eslint/config";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts}"],
    },
    {
        ignores: ["lib", "tests"],
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ["*.config.*"],
                    defaultProject: "tsconfig.json"
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
]);
