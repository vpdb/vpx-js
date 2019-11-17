# Visual Pinball X in JavaScript

*A port of the best pinball simulator out there*

[![Build Status][travis-image]][travis-url]
[![codecov](https://codecov.io/gh/vpdb/vpx-js/branch/master/graph/badge.svg)](https://codecov.io/gh/vpdb/vpx-js)
[![Dependencies][dependencies-image]][dependencies-url]

## Features

This isn't a ready-to-use game. It's a library of loosely-coupled components that
together implement [Visual Pinball](https://sourceforge.net/projects/vpinball/)'s
player for the web.

The player can be split into three parts:

1. The rendering engine
2. The physics engine
3. The scripting engine

This library provides an abstraction layer for rendering with [three.js](https://threejs.org/),
which covers the first point. A physics loop is implemented by the `Player`
class. Collision detection and rigid body dynamics are fully ported, covering the
second part. Work on scripting has begun with the wiring set up and the default
table script working. More info about how we go about this can be found
[here](https://github.com/freezy/vpweb/issues/1).

### Rendering

VPX-JS reads Visual Pinball's VPX format and extracts all meshes in VP's internal
format. Using an abstraction layer, any WebGL framework can convert this format
and construct a scene. An adapter for three.js is included.

Additionally, VPX-JS supports direct export to [GLTF](https://www.khronos.org/gltf/)
files, which is nice, because it allows off-loading the export to a server. It's
also nice because GLTF allows doing stuff that Visual Pinball's [OBJ](https://en.wikipedia.org/wiki/Wavefront_.obj_file)
export doesn't, for example:

- Include materials, textures and lights in one single file
- Apply optimizations:
   - PNG textures with no transparency are converted to JPEG
   - PNG textures with transparency are [PNG-crushed](https://en.wikipedia.org/wiki/Pngcrush)
   - Compress meshes with [Draco](https://google.github.io/draco/)

![image](https://user-images.githubusercontent.com/70426/56841267-0419fc00-688d-11e9-9996-6d84070da392.png)
*A table in the browser using three.js*

### Physics

VPX-JS uses the same physics code than Visual Pinball. That means the gameplay
is identical in the browser than when running VPX.

### Scripting and VPM

For scripting, see [this issue](https://github.com/freezy/vpweb/issues/1). About
VPM, there isn't a JavaScript implementation of PinMAME yet. However, @neophob
wrote a [WPC emulator](https://github.com/neophob/wpc-emu) from scratch that will
cover many games already.

## Development Setup

Given this is a lib, you'll need an actual web application to test. There is a
simple one we're currently using for development [here](https://github.com/freezy/vpweb).

This *vpweb* project retrieves VPX-JS from NPM, so in order to iterate rapidly,
we'll link it to your local working copy.

```bash
git clone https://github.com/vpdb/vpx-js.git
cd vpx-js
npm ci
npm link
npm run build:watch
```

And the vpweb host application:

```bash
git clone https://github.com/freezy/vpweb.git
cd vpweb
npm ci
npm link vpx-js
npm start
```

Then connect to `http://localhost:8080` and drag a VPX file into it. Note that
the scripting engine is still limited. However, the table script of the default
table should now work.

## Usage

WIP. The API will be documented when it's considered stable.

## Tests

Run tests with:

```bash
npm run test
```

For more infos about how tests are written, see [here](https://github.com/vpdb/vpx-js/tree/master/test#readme)

## VPX Fileformat

VPX files using Microsoft OLE2 files (also called Structured Storage, Compound File Binary Format or Compound Document File Format). Some links to work (extract/repack) those files:
- [oletools]: https://www.decalage.info/python/oletools
- [Visual Pinball]: https://vpinball.com/

## Credits

* @jsm174 for getting the Nearley grammar right and his work on translating VBScript to JavaScript
* @neophob for his awesome WPC-EMU integration

<a title="IntelliJ IDEA" href="https://www.jetbrains.com/idea/"><img src="https://raw.githubusercontent.com/vpdb/server/master/assets/intellij-logo-text.svg?sanitize=true" alt="IntelliJ IDEA" width="250"></a>

Special thanks go to JetBrains for their awesome IDE and support of the Open Source Community!

## License

GPLv2, see [LICENSE](LICENSE).

[travis-image]: https://img.shields.io/travis/vpdb/vpx-js.svg?style=flat-square
[travis-url]: https://travis-ci.org/vpdb/vpx-js
[dependencies-image]: https://david-dm.org/vpdb/vpx-js.svg?style=flat-square
[dependencies-url]: https://david-dm.org/vpdb/vpx-js
