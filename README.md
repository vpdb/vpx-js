# Visual Pinball X in JavaScript

*A port of the best pinball simulator out there*

[![Build Status][travis-image]][travis-url]
[![codecov](https://codecov.io/gh/vpdb/vpx-toolbox/branch/master/graph/badge.svg)](https://codecov.io/gh/vpdb/vpx-toolbox)
[![Dependencies][dependencies-image]][dependencies-url]

## Features

This isn't a ready-to-use game. It's a library of loosely-coupled components that
implement some of Visual Pinball's features.

Visual Pinball's player can be split into three parts:

1. The rendering engine
2. The physics engine
3. The scripting engine
    
This library allows exporting a VPX file into a [three.js](https://threejs.org/)
scene, which covers the first point. A physics loop is implemented by the `Player`
class. Collision detection and rigid body dynamics will be fully ported, covering
the second part. The third part is still TODO, more details can be found [here](https://github.com/freezy/vpweb/issues/1).  
    
### Rendering 

VPX-JS allows reading a VPX file file and exporting a three.js scene directly
in the browser. However, it also supports export to [GLTF](https://www.khronos.org/gltf/)
files, which is nice, because it allows off-loading the export to a server.

So why use this when Visual Pinball already has an [OBJ](https://en.wikipedia.org/wiki/Wavefront_.obj_file)
export feature? Well, VPX-JS does some more things:

- GLTF is somewhat more powerful than OBJ. It allows us to include materials, 
  textures and lights in one single file.
- VPX-JS does some optimizations when reading data from the `.vpx` file:
   - PNG textures with no transparency are converted to JPEG
   - PNG textures with transparency are [PNG-crushed](https://en.wikipedia.org/wiki/Pngcrush)
   - Meshes are compressed using [Draco](https://google.github.io/draco/)
- It's platform-independent, so you can run it on Linux and MacOS as well.

![image](https://user-images.githubusercontent.com/70426/56841267-0419fc00-688d-11e9-9996-6d84070da392.png)

### Physics

VPX-JS uses the same physics code than Visual Pinball. That means the gameplay
is identical in the browser than when running VPX. 

### Scripting and VPM

For scripting, see [this issue](https://github.com/freezy/vpweb/issues/1). About
VPM, there isn't a JavaScript implementation of PinMAME yet. However, @neophob
wrote a [WPC emulator](https://github.com/neophob/wpc-emu) from scratch that will
cover many games already. 

## Installation

Clone the repo and use it! At some point it'll be on NPM.

```bash
git clone https://github.com/vpdb/vpx-js.git
cd vpx-js
npm run build
```

## Usage

WIP. The API will be documented when it's considered stable.

## Tests

Run tests with:

```bash
npm run test
```

Most of the tests are related to the mesh generation. We basically take Visual 
Pinball's OBJ export as a base line and verify that the vertices in the GLTF file
are the same. We do that for every playfield item and their variations. We also 
apply transformations to test the matrices. We test textures by feeding multiple 
formats into VPX and comparing the exported result using [looks-same](https://github.com/gemini-testing/looks-same).
What's currently not tested are:

- Vertex indices
- Texture UVs
- Materials

Those are all easily verifiable by looking at the result though. Materials are
still being tweaked because they obviously depend on the engine and the shaders.
We're currently using the metalness/shininess model which seems to work well.

## License

GPLv2, see [LICENSE](LICENSE).

[travis-image]: https://img.shields.io/travis/vpdb/vpx-toolbox.svg?style=flat-square
[travis-url]: https://travis-ci.org/vpdb/vpx-toolbox
[dependencies-image]: https://david-dm.org/vpdb/vpx-toolbox.svg?style=flat-square
[dependencies-url]: https://david-dm.org/vpdb/vpx-toolbox
