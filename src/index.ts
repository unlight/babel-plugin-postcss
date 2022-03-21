import babel, { ConfigAPI, NodePath } from '@babel/core';
import * as Node from '@babel/types';
import { dirname, resolve } from 'path';
import globby from 'globby';

import { getCss } from './getcss';
import fs from 'fs';

export type CreatePluginOptions = {
    readFile: Function;
    globFiles: (patterns: typeof defaultOptions.externalDependencies) => string[];
    mtimeFile: Function;
};
export type PluginOptions = typeof defaultOptions;
type Api = typeof babel & ConfigAPI & { addExternalDependency: (ref: string) => void };

const defaultOptions = {
    test: /\.css$/ as RegExp | Function,
    postcss: undefined as undefined | string | boolean,
    tagged: undefined as undefined | [string, string],
    externalDependencies: undefined as undefined | string | string[],
};

export default babelPluginPostcssFactory();

export function babelPluginPostcssFactory(options: Partial<CreatePluginOptions> = {}) {
    const {
        globFiles = globby.sync as CreatePluginOptions['globFiles'],
        readFile = fs.readFileSync,
        mtimeFile = file => fs.statSync(file).mtimeMs,
    } = options;
    return babelPluginPostcss.bind(undefined, { globFiles, readFile, mtimeFile });
}

/**
 * https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#writing-your-first-babel-plugin
 */
function babelPluginPostcss(
    createOptions: CreatePluginOptions,
    { types: t, cache, addExternalDependency }: Api,
    options: PluginOptions,
) {
    const { readFile, globFiles, mtimeFile } = createOptions;
    options = { ...defaultOptions, ...options };
    const testFilepath =
        typeof options.test === 'function'
            ? options.test
            : (file: string): boolean => (options.test as RegExp).test(file);
    let localCssImportSpecifier: Node.Identifier | undefined;
    if (options.externalDependencies) {
        const files = globFiles(options.externalDependencies);
        for (const file of files) {
            addExternalDependency(file);
            cache.invalidate(() => mtimeFile(file));
        }
    }

    function importDeclarationExit(path: NodePath<Node.ImportDeclaration>, state: any) {
        const filepath = resolve(
            dirname(state.file.opts.filename),
            path.node.source.value,
        );
        if (!testFilepath(filepath)) {
            return;
        }

        const defaultImportName: string | undefined = path.node.specifiers.find(
            specifier => specifier.type === 'ImportDefaultSpecifier',
        )?.local?.name;
        if (!defaultImportName) {
            return;
        }
        const cssContent = getCss({
            filepath,
            readFile,
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
                    [
                        t.importSpecifier(
                            localCssImportSpecifier,
                            t.identifier(taggedLocalImport),
                        ),
                    ],
                    t.stringLiteral(taggedImportModule),
                ),
            );
            variableDeclaratorInit = t.taggedTemplateExpression(
                t.identifier(localCssImportSpecifier!.name),
                t.templateLiteral(
                    [t.templateElement({ raw: cssContent, cooked: cssContent })],
                    [],
                ),
            );
        } else {
            variableDeclaratorInit = t.stringLiteral(cssContent);
        }
        path.replaceWith(
            t.variableDeclaration('const', [
                t.variableDeclarator(
                    t.identifier(defaultImportName),
                    variableDeclaratorInit,
                ),
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
