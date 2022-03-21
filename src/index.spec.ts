import { transform } from '@babel/core';
import { stripIndents } from 'common-tags';
import expect from 'expect';

import { babelPluginPostcssFactory, PluginOptions, CreatePluginOptions } from '.';

function run({
    createOptions,
    source,
    options,
    plugins,
}: {
    source: string;
    createOptions?: Partial<CreatePluginOptions>;
    options?: Partial<PluginOptions>;
    plugins?: any[];
}) {
    const plugin = babelPluginPostcssFactory(createOptions);
    const { code } = transform(source, {
        filename: 'test.ts',
        plugins: [[plugin, { ...(options || {}) }], ...(plugins || [])],
    })!;
    return code;
}

it('smoke', () => {
    const result = run({
        source: `const foo = 1`,
    });
    expect(result).toEqual(`const foo = 1;`);
});

it('get styles single', () => {
    const result = run({
        createOptions: {
            readFile: () => 'a {}',
        },
        source: stripIndents`import style from 'style.css';`,
    });
    expect(result).not.toEqual(expect.stringMatching(`import style from 'style.css'`));
    expect(result).toEqual(expect.stringMatching('const style = "a {}";'));
});

it('styles with postcss option', () => {
    const result = run({
        createOptions: {
            readFile: () => 'a { top: center }',
        },
        options: { postcss: true },
        source: stripIndents`import style from 'style.css';`,
    });
    expect(result).toEqual(
        `const style = "a { position: absolute; top: 50%; transform: translateY(-50%) }";`,
    );
});

it('get styles array', () => {
    const result = run({
        source: stripIndents`
        import style1 from 'p1.css';
        import style2 from 'p2.css';
        `,
        createOptions: {
            readFile: (file: string) => `.${file.slice(-6, -4)} {}`,
        },
    });
    expect(result).toEqual(expect.stringMatching('const style1 = ".p1 {}'));
    expect(result).toEqual(expect.stringMatching('const style2 = ".p2 {}'));
});

it('side effect import', () => {
    const result = run({
        source: stripIndents`import 'style.css';`,
        createOptions: {
            readFile: () => 'a {}',
        },
    });
    expect(result).toEqual(expect.stringMatching(`import 'style.css';`));
});

it('unknow file should not be touched', () => {
    const result = run(
        stripIndents`
        import style from 'style.vue';
        `,
        {
            readFileSync: () => 'a {}',
        },
    );
    expect(result).toEqual(expect.stringMatching(`import style from 'style.vue'`));
});

it('file with matched extension is transformed', () => {
    const result = run(
        stripIndents`
        import style from 'style.pcss';
        `,
        {
            readFileSync: () => 'a {}',
            test: /\.p?css$/,
        },
    );
    expect(result).toEqual(expect.stringMatching(`const style = "a {}";`));
});

it('function as test option is executed', () => {
    const result = run(
        stripIndents`
        import style from 'style.pcss';
        `,
        {
            readFileSync: () => 'a {}',
            test: file => file.includes('.pcss'),
        },
    );
    expect(result).toEqual(expect.stringMatching(`const style = "a {}";`));
});

it('tagged template expression', () => {
    const result = run(
        stripIndents`
        import style from 'style.css';
        `,
        {
            readFileSync: () => 'a {}',
            tagged: ['css', 'lit-element'],
        },
    );
    expect(result).toEqual(
        expect.stringMatching('import { css as _css } from "lit-element"'),
    );
    expect(result).toEqual(expect.stringMatching('const style = _css`a {}`'));
    expect(result).toEqual(
        expect.stringMatching(stripIndents`
        import { css as _css } from "lit-element";
        const style = _css\`a {}\`;
    `),
    );
});

it('external dependency', () => {
    const result = run(
        stripIndents`
        import style from 'styles/a/b/style.css';
        `,
        {
            readFileSync: () => 'a { }',
            postcss: true,
            externalDependencies: ['styles/**/*.css'],
        },
    );
    console.log('result', result);
    // expect(result).toEqual(
    //     `const style = "a { position: absolute; top: 50%; transform: translateY(-50%) }";`,
    // );
});

it('multiple external dependencies');
