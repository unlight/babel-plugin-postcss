# babel-plugin-postcss

Replace import from css by content transformed by postcss

## Examples

Input:

```ts
import style1 from './style.css';
import style2 from './style.css'; // options: { tagged: ['css', 'lit-element'] }
```

Output:

```ts
var style1 = '/* style.css content */';
import { css } from 'lit-element';
var style2 = css`
    /* style.css content */
`;
```

## Install

1. `npm install --save-dev babel-plugin-postcss`
2. Add `['babel-plugin-postcss', { options }]` to plugins section of babel config.

## Options

#### test

Regular expression or function which test importee for being parsed as style file (css).  
Type: `RegExp | Function`  
Default: `/\.css$/`  
Example: `/\.css$/` only `.css` imports will be parsed

#### postcss

If value is truthy css content will be processed by postcss,
postcss config will be loaded by `postcss-load-config`.  
Type: `undefined | boolean`  
Default: `undefined`

#### tagged

Wrap css content to tagged template, array of two elements. First is tagged function,
second is module where import the tagged function from.  
Type: `undefined | [string, string]`  
Default: `undefined`  
Example: `['css', 'lit-element']`

Input:

```ts
import style3 from './style3.css';
```

Output:

```ts
import { css } from 'lit-element';
var style2 = css`
    /* style3.css content */
`;
```
