import { transform } from '@babel/core';
import { stripIndents } from 'common-tags';
import { expect } from 'earljs';

import plugin, { PluginOptions } from '.';

function run(source: string, options?: Partial<PluginOptions>, ...plugins_: any[]) {
    const { code } = transform(source, {
        filename: 'test.ts',
        plugins: [[plugin, { test: /\.css$/, ...(options || {}) }], ...plugins_],
    })!;
    return code;
}

it('smoke', () => {
    const result = run(`const foo = 1`);
    expect(result).toEqual(`const foo = 1;`);
});

it('get styles single', () => {
    const result = run(
        stripIndents`
        import style from 'style.css';
        `,
        {
            readFileSync: () => 'a {}',
        },
    );
    expect(result).not.toEqual(expect.stringMatching(`import style from 'style.css'`));
    expect(result).toEqual(expect.stringMatching('const style = "a {}";'));
});

it('styles with postcss option', () => {
    const result = run(
        stripIndents`
        import style from 'style.css';
        `,
        {
            readFileSync: () => 'a { top: center }',
            postcss: true,
        },
    );
    expect(result).toEqual(
        `const style = "a { position: absolute; top: 50%; transform: translateY(-50%) }";`,
    );
});

it('get styles array', () => {
    const result = run(
        stripIndents`
        import style1 from 'p1.css';
        import style2 from 'p2.css';
        `,
        {
            readFileSync: (file: string) => `.${file.slice(-6, -4)} {}`,
        },
    );
    expect(result).toEqual(expect.stringMatching('const style1 = ".p1 {}'));
    expect(result).toEqual(expect.stringMatching('const style2 = ".p2 {}'));
});

it('side effect import', () => {
    const result = run(
        stripIndents`
        import 'style.css';
        `,
        {
            readFileSync: () => 'a {}',
        },
    );
    expect(result).toEqual(expect.stringMatching(`import 'style.css';`));
});

it('unknow file should be touched', () => {
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
    expect(result).toEqual(expect.stringMatching('import { css as _css } from "lit-element"'));
    expect(result).toEqual(expect.stringMatching('const style = _css`a {}`'));
    expect(result).toEqual(
        expect.stringMatching(stripIndents`
        import { css as _css } from "lit-element";
        const style = _css\`a {}\`;
    `),
    );
});
