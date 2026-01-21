import { TSESTree } from '@typescript-eslint/types';
import { ESLintUtils, TSESLint } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(name => `https://github.com/Benjas333/SAMMI-Next/tree/master/packages/eslint-plugin/docs/rules/${name}.md`);

export const enforceDefaultExportFunction = createRule({
    name: 'enforce-default-export-function',
    meta: {
        docs: {
            description: 'enforce the default export is a function with no parameters',
        },
        type: 'problem',
        messages: {
            'problem:default-export-not-function': 'Default export must be a function.',
            'problem:default-export-has-params': 'Default export function must not have parameters.'
        },
        schema: [],
    },
    defaultOptions: [],
    create: context => {
        const sourceCode = context.sourceCode;
        const parserServices = sourceCode.parserServices;
        const checker = parserServices && parserServices.program ? parserServices.program.getTypeChecker() : null;


        function isFunctionNode(node: TSESTree.Node | null): boolean {
            if (!node) return false;

            const type = node.type;
            return (
                type === TSESTree.AST_NODE_TYPES.FunctionDeclaration ||
                type === TSESTree.AST_NODE_TYPES.FunctionExpression ||
                type === TSESTree.AST_NODE_TYPES.ArrowFunctionExpression
            );
        }

        function nodeHasParams(node: TSESTree.Node | null): boolean {
            if (!node) return false;

            if (
                node.type === TSESTree.AST_NODE_TYPES.FunctionDeclaration ||
                node.type === TSESTree.AST_NODE_TYPES.FunctionExpression ||
                node.type === TSESTree.AST_NODE_TYPES.ArrowFunctionExpression
            ) {
                const params = node.params;
                return Array.isArray(params) && params.length > 0;
            }

            if (node.type === TSESTree.AST_NODE_TYPES.CallExpression) {
                if (!parserServices || !checker || !parserServices.esTreeNodeToTSNodeMap) return true;

                try {
                    const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                    const type = checker.getTypeAtLocation(tsNode);
                    if (!type) return true;

                    const sigs = type.getCallSignatures();
                    if (sigs && sigs.length > 0) {
                        for (const s of sigs) {
                            const params = s.getParameters();
                            if (params && params.length > 0) return true;
                        }

                        return false;
                    }

                    if (type.isUnion() && typeof type.types === 'object') {
                        const parts = type.types;
                        for (const p of parts) {
                            const psigs = p.getCallSignatures();
                            for (const s of psigs) {
                                if (s.getParameters().length > 0) return true;
                            }
                        }

                        return false;
                    }

                    return true;
                } catch {
                    return true;
                }
            }

            return false;
        }

        function CallExpressionReturnsFunction(node: TSESTree.Node | null): boolean {
            if (!node || node.type !== TSESTree.AST_NODE_TYPES.CallExpression) return false;
            if (!parserServices || !checker || !parserServices.esTreeNodeToTSNodeMap) return false;

            try {
                const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                const type = checker.getTypeAtLocation(tsNode);
                if (!type) return false;

                const sigs = type.getCallSignatures();
                if (sigs && sigs.length > 0) return true;

                if (type.isUnion() && Array.isArray(type.types)) {
                    for (const part of type.types) {
                        const psigs = part.getCallSignatures();
                        if (psigs && psigs.length > 0) return true;
                    }
                }

                return false;
            } catch {
                return false;
            }
        }

        const reportOnParams = (node: TSESTree.Node) => {
            if (!nodeHasParams(node)) return;

            context.report({
                node,
                messageId: 'problem:default-export-has-params'
            });
        }

        return {
            ExportDefaultDeclaration: node => {
                const decl = node.declaration;

                if (isFunctionNode(decl)) {
                    reportOnParams(decl);
                    return;
                }

                if (decl && decl.type === TSESTree.AST_NODE_TYPES.CallExpression) {
                    if (CallExpressionReturnsFunction(decl)) {
                        reportOnParams(decl);
                        return;
                    }
                }

                if (decl && decl.type === TSESTree.AST_NODE_TYPES.Identifier) {
                    let scope: TSESLint.Scope.Scope | null = sourceCode.getScope(node);

                    let defNode: TSESTree.Node | null = null;
                    while (scope) {
                        const variable = scope.set.get(decl.name);
                        if (variable && variable.defs && variable.defs.length) {
                            defNode = variable.defs[0].node;
                            break;
                        }

                        scope = scope.upper;
                    }

                    if (defNode) {
                        if (isFunctionNode(defNode)) {
                            reportOnParams(defNode);
                            return;
                        }

                        if (defNode.type === TSESTree.AST_NODE_TYPES.VariableDeclarator && defNode.init) {
                            const init = defNode.init;

                            if (isFunctionNode(defNode.init)) {
                                reportOnParams(defNode.init);
                                return;
                            }

                            if (
                                init.type === TSESTree.AST_NODE_TYPES.CallExpression &&
                                CallExpressionReturnsFunction(init)
                            ) {
                                reportOnParams(init);
                                return;
                            }
                        }
                    }
                }

                context.report({
                    node,
                    messageId: 'problem:default-export-not-function'
                })
            }
        };
    },
});
