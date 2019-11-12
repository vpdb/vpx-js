# Modules

This library is written in Typescript, so in the code, we use ES2015 imports.
That's great, but we finally want to ship JavaScript code. That's when things
get hairy. What we would like to do is the following: 

- Ship JavaScript as tree-shakable ES2015 module using [`pkg.module`](https://github.com/rollup/rollup/wiki/pkg.module)
- Also ship JavaScript as CommonJS module for Node.js
- Include typings
- Ship code that works on both Node.js and in the browser

The last point is a bit tricky because Node.js and the browser don't have the
same APIs. What we do is use [`pkg.browser`](https://docs.npmjs.com/files/package.json#browser)
which will switch out a file when compiling for a browser environment.

The switched out file is [`refs.node.ts`](refs.node.ts), which is replaced by 
[`refs.browser.ts`](refs.browser.ts). Here we reference stuff we only want in 
one environment.

## Three.js

Three.js comes in three flavors.

1. As an CommonJS module (`build/three.js`)
2. As an ES2015 module (`build/three.module.js`)
3. As individual files (`src/*`)

In Typescript, when importing `from 'three'`, definitions point to the modules.
In the browser, that means the entire `three.module.js` is referenced and hence
included in the build. On Node.js, the CommonJS module is used (where we care less 
about tree-shaking).

We can [solve the tree-shaking problem](https://github.com/mrdoob/three.js/issues/9403)
by not importing `from 'three'` but from each file individually. So

```ts
import { Object3D } from 'three'; 
```
becomes
```ts
import { Object3D } from 'three/src/core/Object3D';
```

However, that will bork Node.js, because the source files use ES2015 imports
among each other, which isn't supported by Node.js. So we need to handle the two
separately.

What we ended up with are object exports in our reference files above. In
`refs.node.ts`, we have:

```ts
export { Object3D } from 'three';
```

In `refs.browser.ts`, we have:
```ts
export { Object3D } from 'three/src/core/Object3D';
```

And in our code we have:

```ts
import { Object3D } from '../refs.node';
```

So in Node.js, all three.js references point to the CommonJS module, while 
during browser builds they get they get switched out to tree-shakable `src` 
links. This works pretty well for the main three.js library.

### Three.js Example Code

The example code from three.js comes with a catch: For whatever reason, all
JSM examples reference the main module, not individual files. So in Node.js they 
don't work at all (there is no CommonJS version, only the `THREE` overrides and
the JSM version), and in the browser we end up with the entire `three.module.js`
again.

We currently only use two example files, `EXRLoader` and `RGBELoader`, so we
suck it up and change their `three` reference to `refs.node` and include them in
our source.

Which brings us to our last problem: We now have JavaScript code in our library,
so we need the `allowJs` flag in `tsconfig.json` on, which means we cannot use
`declaration` anymore.

BTW just copying the files won't work either because remember we ship a CommonJS
build, and they still are in ES2015. Luckily Typescript has a `emitDeclarationOnly`
flag, which we can use in a second `tsconfig.json` to generate the typings.

**Note 1:** `ts-node` doesn't have any problems with running ES2015 imports, 
because it will transpile them anyway.

**Note 2:** Tree shaking three.js for VPX-JS gets it down to a third. But given
that the host application will need more than that (for starters, a renderer),
it might finally not be worth the effort and we can go back to 
`import {} from 'three';`. However, the *examples* problem will always persist
because there just isn't any Node.js compatible version packaged in three.js.

**Note 3:** We ended up using the ESM version of three.js everywhere because it
ended up in the build anyway (for unknown reasons) and thus resulted in shipping
most of the code twice.
