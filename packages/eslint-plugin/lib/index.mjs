import { rules } from "./rules/index.mjs";
import { name, version } from "./packages/eslint-plugin/package.mjs";
import { defineConfig } from "eslint/config";

//#region src/index.ts
const plugin = {
	meta: {
		name,
		version
	},
	configs: {
		recommended: [],
		requiredEntry: []
	},
	rules
};
plugin.configs = {
	recommended: [],
	requiredEntry: defineConfig({
		name: "sammi-next/required-entry",
		plugins: { "sammi-next": plugin },
		rules: { "sammi-next/enforce-default-export-function": "error" }
	})
};
var src_default = plugin;

//#endregion
export { src_default as default };
//# sourceMappingURL=index.mjs.map