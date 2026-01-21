import { RuleDefinition, RuleDefinitionTypeOptions } from "./node_modules/.bun/@eslint_core@1.0.1/node_modules/@eslint/core/dist/esm/types.mjs";
import { Config } from "eslint/config";

//#region src/index.d.ts
declare const plugin: {
  meta: {
    name: string;
    version: string;
  };
  configs: {
    /**
             * Recommended rules for SAMMI Next Extensions code syntax that you can drop in without additional configuration.
             */
    recommended: Config[];
    /**
             * Required rules for SAMMI Next Extension entry that will be compiled to the [insert_script] in the .sef file.
             */
    requiredEntry: Config[];
  };
  rules: Record<string, RuleDefinition<RuleDefinitionTypeOptions>>;
};
//#endregion
export { plugin as default };
//# sourceMappingURL=index.d.mts.map