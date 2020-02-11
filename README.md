# babel-plugin-postcss

Input:

```ts
import { customElement, LitElement } from 'lit-element';
import style from './my-element.css';

@customElement('my-element')
export class MyElement extends LitElement {
    static styles = style;
}
```

Output:

```ts
import { customElement, LitElement } from 'lit-element';
import { css } from 'lit-element';

@customElement('my-element')
export class MyElement extends LitElement {
    static styles = css`
        /* my-element.css content */
    `;
}
```

## Install

```sh
npm install --save-dev babel-plugin-postcss
```
