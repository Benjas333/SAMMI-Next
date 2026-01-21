import { RuleTester } from "@typescript-eslint/rule-tester";
import { enforceDefaultExportFunction } from "../src/rules/enforce-default-export-function";
import * as vitest from 'vitest';
import path from "node:path";
import tseslint from 'typescript-eslint';

RuleTester.afterAll = vitest.afterAll;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            projectService: {
                allowDefaultProject: ["*.ts"],
                defaultProject: "tsconfig.json",
            },
            tsconfigRootDir: path.join(__dirname, ".."),
        },
    },
});

ruleTester.run('enforce-default-export-function', enforceDefaultExportFunction, {
    valid: [
        {
            code: 'export default () => {};',
        },
        {
            code: 'export default function test() {};'
        },
        {
            code: 'export default function() {};'
        },
        {
            code: 'const test = () => {}; export default test;'
        },
        {
            code: 'function test() {}; export default test;'
        },
        {
            code: `\
function insertCommandSection(
    callback: () => void,
): () => void {
    const wrapper = () => {
        callback();
    };

    return wrapper;
}
export default insertCommandSection(() => {});`
        }
    ],
    invalid: [
        {
            code: 'const test = "test"; export default test;',
            errors: [
                {
                    messageId: 'problem:default-export-not-function',
                },
            ],
        },
        {
            code: 'export default "test";',
            errors: [
                {
                    messageId: 'problem:default-export-not-function',
                },
            ]
        },
        {
            code: 'export default (a, b) => {};',
            errors: [
                {
                    messageId: 'problem:default-export-has-params',
                }
            ]
        },
        {
            code: 'export default function test(a, b) {};',
            errors: [
                {
                    messageId: 'problem:default-export-has-params',
                }
            ]
        },
        {
            code: 'export default function(a, b) {};',
            errors: [
                {
                    messageId: 'problem:default-export-has-params',
                }
            ]
        },
        {
            code: 'const test = (a, b) => {}; export default test;',
            errors: [
                {
                    messageId: 'problem:default-export-has-params',
                }
            ]
        },
        {
            code: 'function test(a, b) {}; export default test;',
            errors: [
                {
                    messageId: 'problem:default-export-has-params',
                }
            ]
        },
    ]
})
