# babel-plugin-lit-element-css

Replace import from css expression to lit-element's css tag function

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
npm install --save-dev babel-plugin-lit-element-css
```
