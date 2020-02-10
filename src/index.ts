import babel, { NodePath, PluginObj } from '@babel/core';
import * as Node from '@babel/types';
import { dirname, resolve } from 'path';

import { getCss } from './getcss';

const defaultOptions = {
    test: (() => false) as RegExp | Function,
    readFileSync: undefined as Function | undefined,
    postcss: undefined as undefined | string | boolean,
};

export type PluginOptions = typeof defaultOptions;

/**
 * https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#writing-your-first-babel-plugin
 */
export default function({ types: t }: typeof babel, options: PluginOptions): PluginObj {
    options = { ...defaultOptions, ...options };
    const testFilepath =
        typeof options.test === 'function'
            ? options.test
            : (file: string): boolean => (options.test as RegExp).test(file);

    let inLitElementDeclaration = '';
    let localCssImportSpecifier: Node.Identifier | undefined;
    const styles = new Map();

    function importDeclarationExit(path: NodePath<Node.ImportDeclaration>, state: any) {
        const filepath = resolve(dirname(state.file.opts.filename), path.node.source.value);
        if (!testFilepath(filepath)) {
            return;
        }
        const defaultImportName = path.node.specifiers.find(
            specifier => specifier.type === 'ImportDefaultSpecifier',
        )?.local?.name;
        if (!defaultImportName) {
            return;
        }
        const style = getCss({
            filepath,
            readFileSync: options.readFileSync,
            postcss: options.postcss,
        });
        if (!localCssImportSpecifier) {
            localCssImportSpecifier = path.scope.generateUidIdentifierBasedOnNode(
                t.identifier('css'),
            );
            path.replaceWith(
                t.importDeclaration(
                    [t.importSpecifier(localCssImportSpecifier, t.identifier('css'))],
                    t.stringLiteral('lit-element'),
                ),
            );
        } else {
            path.remove();
        }
        styles.set(defaultImportName, style);
    }

    function classDeclaration(path: NodePath<Node.ClassDeclaration>) {
        if (t.isIdentifier(path.node.superClass, { name: 'LitElement' }) && styles.size > 0) {
            inLitElementDeclaration = path.node.id.name;
            path.traverse({ ClassBody: classBody });
        }
    }

    function classDeclarationExit() {
        inLitElementDeclaration = '';
    }

    function classBody(path: NodePath<Node.ClassBody>) {
        if (!inLitElementDeclaration) {
            return;
        }
        const classPropertyNodePath = path.get('body').find(p => {
            return (
                t.isClassProperty(p.node, { static: true }) &&
                t.isIdentifier(p.node.key, { name: 'styles' })
            );
        });
        if (classPropertyNodePath) {
            classPropertyNodePath.traverse({ Identifier: replaceStyleIdentifier });
        }
    }

    function classMethod(path: NodePath<Node.ClassMethod>) {
        if (
            inLitElementDeclaration &&
            t.isClassMethod(path.node, { static: true }) &&
            t.isIdentifier(path.node.key, { name: 'styles' })
        ) {
            path.traverse({ Identifier: replaceStyleIdentifier });
        }
    }

    function replaceStyleIdentifier(path: NodePath<Node.Identifier>) {
        if (!localCssImportSpecifier) {
            throw new Error('localCssImportSpecifier is undefined');
        }
        if (path.isReferencedIdentifier() && styles.has(path.node.name)) {
            path.replaceWith(
                t.taggedTemplateExpression(
                    t.identifier(localCssImportSpecifier.name),
                    t.templateLiteral([t.templateElement({ raw: styles.get(path.node.name) })], []),
                ),
            );
        }
    }

    function programExit() {
        inLitElementDeclaration = '';
        localCssImportSpecifier = undefined;
        styles.clear();
    }

    return {
        visitor: {
            ClassDeclaration: { enter: classDeclaration, exit: classDeclarationExit },
            ClassMethod: { enter: classMethod },
            ImportDeclaration: { exit: importDeclarationExit },
            Program: { exit: programExit },
        },
    };
}
