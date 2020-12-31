import babel, { NodePath, PluginObj } from '@babel/core';
import * as Node from '@babel/types';
import { dirname, resolve } from 'path';

import { getCss } from './getcss';

const defaultOptions = {
    test: (() => false) as RegExp | Function,
    readFileSync: undefined as Function | undefined,
    postcss: undefined as undefined | string | boolean,
    tagged: undefined as undefined | [string, string],
};

export type PluginOptions = typeof defaultOptions;

/**
 * https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#writing-your-first-babel-plugin
 */
export default function ({ types: t }: typeof babel, options: PluginOptions): PluginObj {
    options = { ...defaultOptions, ...options };
    const testFilepath =
        typeof options.test === 'function'
            ? options.test
            : (file: string): boolean => (options.test as RegExp).test(file);

    let localCssImportSpecifier: Node.Identifier | undefined;

    function importDeclarationExit(path: NodePath<Node.ImportDeclaration>, state: any) {
        const filepath = resolve(dirname(state.file.opts.filename), path.node.source.value);
        if (!testFilepath(filepath)) {
            return;
        }
        const defaultImportName: string | undefined = path.node.specifiers.find(
            (specifier) => specifier.type === 'ImportDefaultSpecifier',
        )?.local?.name;
        if (!defaultImportName) {
            return;
        }
        const cssContent = getCss({
            filepath,
            readFileSync: options.readFileSync,
            postcss: options.postcss,
        });
        let variableDeclaratorInit: Node.Expression | undefined;
        if (options.tagged) {
            const [taggedLocalImport, taggedImportModule] = options.tagged;
            if (!localCssImportSpecifier) {
                localCssImportSpecifier = path.scope.generateUidIdentifierBasedOnNode(
                    t.identifier(taggedLocalImport),
                );
            }
            path.insertBefore(
                t.importDeclaration(
                    [t.importSpecifier(localCssImportSpecifier, t.identifier(taggedLocalImport))],
                    t.stringLiteral(taggedImportModule),
                ),
            );
            variableDeclaratorInit = t.taggedTemplateExpression(
                t.identifier(localCssImportSpecifier!.name),
                t.templateLiteral([t.templateElement({ raw: cssContent, cooked: cssContent })], []),
            );
        } else {
            variableDeclaratorInit = t.stringLiteral(cssContent);
        }
        path.replaceWith(
            t.variableDeclaration('const', [
                t.variableDeclarator(t.identifier(defaultImportName), variableDeclaratorInit),
            ]),
        );
    }

    function programExit() {
        localCssImportSpecifier = undefined;
    }

    return {
        visitor: {
            ImportDeclaration: { exit: importDeclarationExit },
            Program: { exit: programExit },
        },
    };
}
