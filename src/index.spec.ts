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
    const options = {
        readFileSync: () => 'h1 {}',
    };
    const result = run(
        stripIndents`
        import style from './my-element.css';

        class MyElement extends LitElement {
            static get styles() {
                return style;
            }
        }`,
        options,
    );
    expect(result).not.toContain(`import style from './my-element.css'`);
    expect(result).toContain('return _css`h1 {}`');
});

it('styles with postcss option', () => {
    const result = run(
        stripIndents`
        import style from './style.css';
        class MyElement extends LitElement {
            static styles = style;
        }`,
        {
            readFileSync: () => 'a { top: center }',
            postcss: true,
        },
        ['@babel/plugin-proposal-class-properties', { loose: true }],
    );
    expect(result).toContain(
        'MyElement.styles = _css`a { position: absolute; top: 50%; transform: translateY(-50%) }`',
    );
});

it('get styles array', () => {
    const options = {
        readFileSync: (file: string) => `.${file.slice(-6, -4)} {}`,
    };
    const result = run(
        stripIndents`
        import style1 from './p1.css';
        import style2 from './p2.css';

        class MyElement extends LitElement {
            static get styles() {
                return [style1, style2];
            }
        }`,
        options,
    );
    expect(result).toContain('return [_css`.p1 {}`, _css`.p2 {}`');
    expect(result).not.toContain(`import style2 from './p2.css'`);
});

it('styles static property loose', () => {
    const result = run(
        stripIndents`
        import style from './style.css';
        class MyElement extends LitElement {
            static styles = style;
        }`,
        {
            readFileSync: () => ':host {}',
        },
        ['@babel/plugin-proposal-class-properties', { loose: true }],
    );
    expect(result).toContain(stripIndents`
        MyElement.styles = _css\`:host {}\`;
    `);
});

it('styles static property loose array', () => {
    const result = run(
        stripIndents`
        import style from './style.css';
        class MyElement extends LitElement {
            static styles = [style];
        }`,
        {
            readFileSync: () => ':host {}',
        },
        ['@babel/plugin-proposal-class-properties', { loose: true }],
    );
    expect(result).toContain(stripIndents`
        MyElement.styles = [_css\`:host {}\`];
    `);
});

it('styles static property strict', () => {
    const result = run(
        stripIndents`
        import style from './style.css';
        class MyElement extends LitElement {
            static styles = style;
        }`,
        {
            readFileSync: () => ':host {}',
        },
        ['@babel/plugin-proposal-class-properties', { loose: false }],
    );
    expect(result).toContain('_defineProperty(MyElement, "styles", _css`:host {}`);');
});

it('styles static property strict array', () => {
    const result = run(
        stripIndents`
        import style from './style.css';
        class MyElement extends LitElement {
            static styles = [style];
        }`,
        {
            readFileSync: () => ':host {}',
        },
        ['@babel/plugin-proposal-class-properties', { loose: false }],
    );
    expect(result).toContain('_defineProperty(MyElement, "styles", [_css`:host {}`]);');
});

it('side effect import', () => {
    const result = run(
        stripIndents`
        import './style.css';
        class MyElement extends LitElement {
            static styles = style;
        }`,
        {
            readFileSync: () => 'a {}',
        },
        ['@babel/plugin-proposal-class-properties', { loose: false }],
    );
    expect(result).toContain(`import './style.css';`);
});
