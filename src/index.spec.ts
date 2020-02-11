import { transform } from '@babel/core';
import { stripIndents } from 'common-tags';

import plugin, { PluginOptions } from '.';

function run(source: string, options?: Partial<PluginOptions>, ...plugins_: any[]) {
    const { code } = transform(source, {
        filename: 'test.ts',
        plugins: [[plugin, { test: /\.css$/, ...(options || {}) }], ...plugins_],
    })!;
    return code;
}

it('smoke', () => {
    const result = run(`var foo = 1`);
    expect(result).toEqual(`var foo = 1;`);
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
    expect(result).not.toContain(`import style from 'style.css'`);
    expect(result).toContain('var style = "a {}";');
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
    expect(result).toContain(
        `var style = "a { position: absolute; top: 50%; transform: translateY(-50%) }";`,
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
    expect(result).toContain('var style1 = ".p1 {}');
    expect(result).toContain('var style2 = ".p2 {}');
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
    expect(result).toContain(`import 'style.css';`);
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
    expect(result).toContain(`import style from 'style.vue'`);
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
    expect(result).toContain('import { css as _css } from "lit-element"');
    expect(result).toContain('var style = _css`a {}`');
    expect(result).toContain(stripIndents`
        import { css as _css } from "lit-element";
        var style = _css\`a {}\`;
    `);
});
