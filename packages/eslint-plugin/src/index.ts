import { rules } from './rules';
import { ESLint } from 'eslint';
import { name, version } from '../package.json';
import { Config, defineConfig } from 'eslint/config';
import type { RuleDefinition, RuleDefinitionTypeOptions } from '@eslint/core';

const plugin = {
    meta: { name, version },
    configs: {
        /**
         * Recommended rules for SAMMI Next Extensions code syntax that you can drop in without additional configuration.
         */
        recommended: [] as Config[],
        /**
         * Required rules for SAMMI Next Extension entry that will be compiled to the [insert_script] section in the .sef file.
         */
        requiredEntry: [] as Config[],
    },
    rules: rules as unknown as Record<string, RuleDefinition<RuleDefinitionTypeOptions>>,
} satisfies ESLint.Plugin;

const requiredEntryConfig: Config[] = defineConfig({
    name: "sammi-next/required-entry",
    plugins: {
        "sammi-next": plugin
    },
    rules: {
        "sammi-next/enforce-default-export-function": "error",
    },
});

plugin.configs = {
    recommended: [],
    requiredEntry: requiredEntryConfig,
}

export default plugin;
