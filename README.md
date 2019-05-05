# VPX Toolbox

*A set of Node.js tools that handles Visual Pinball files.*

[![Build Status][travis-image]][travis-url]
[![codecov](https://codecov.io/gh/vpdb/vpx-toolbox/branch/master/graph/badge.svg)](https://codecov.io/gh/vpdb/vpx-toolbox)
[![Dependencies][dependencies-image]][dependencies-url]

## Features

Convert `.vpx` files to [GLTF](https://www.khronos.org/gltf/) files.

- `.vpx` files are the binary files that [Visual Pinball](https://sourceforge.net/projects/vpinball/) 
  uses to store a pinball game.
- `.glb`/`.gltf` files contain 3D scenes in an open and royalty-free format. 
  Tooling for this format is [excellent](https://github.com/KhronosGroup/glTF#gltf-tools)
  and I don't know of any 3D modelling software that doesn't support it.

So why use this when Visual Pinball already has an [OBJ](https://en.wikipedia.org/wiki/Wavefront_.obj_file)
export feature? Well, VPX Toolbox does some more things:

- GLTF is somewhat more powerful than OBJ. It allows us to include materials, 
  textures and lights in one single file.
- VPX Toolbox does some optimizations when reading data from the `.vpx` file:
   - PNG textures with no transparency are converted to JPEG
   - PNG textures with transparency are [PNG-crushed](https://en.wikipedia.org/wiki/Pngcrush)
   - Meshes are compressed using [Draco](https://google.github.io/draco/)
- It's platform-independent, so you can run it on Linux and MacOS as well.   

## Installation

- Install [Node.js](https://nodejs.org/en/)
- Open a terminal and type:

```bash
npm install -g vpx-toolbox
```

## Usage

For tests and tooling, there is a command line tool:

```bash
vpt2glb <source.vpx> [<destination.glb>]
```
    
Otherwise, the API is quite simple:

```js
const { writeFileSync } = require('fs');
const { Table } = require(`vpx-toolbox`);

(async () => {
	
	// parse the table
	const vpt = await Table.load('my-table.vpx');

	// export the table to GLB
	const glb = await vpt.exportGlb({
		applyTextures: true,
		applyMaterials: true,
		exportLightBulbLights: true,
		optimizeTextures: true,
		gltfOptions: { compressVertices: true, forcePowerOfTwoTextures: true },
		exportPrimitives: true,
		exportTriggers: true,
		exportKickers: true,
		exportGates: true,
		exportHitTargets: true,
		exportFlippers: true,
		exportBumpers: true,
		exportRamps: true,
		exportSurfaces: true,
		exportRubbers: true,
		exportLightBulbs: true,
		exportPlayfieldLights: true,
		exportPlayfield: true,
	});

	// write to disk
	writeFileSync('my-table.glb', glb);	
})();
```
 
## Result

For a quick check you can use one of the [various](https://sandbox.babylonjs.com/)
[online](https://threejs.org/editor/) [viewers](https://gltf-viewer.donmccurdy.com/). 
The default Windows [3D Viewer](https://en.wikipedia.org/wiki/Microsoft_3D_Viewer) comes
with GLTF support as well, however it doesn't suppor the Dracos extensions, so 
you'll need to disable mesh compression if you want to open it with 3D Viewer.

VPDB uses this to display 3D models in the browser:

![image](https://user-images.githubusercontent.com/70426/56841267-0419fc00-688d-11e9-9996-6d84070da392.png)

[Live version](https://vpdb.io/games/dk/releases/pkvazc1pw) (click on *3D View*)

## License

GPLv2, see [LICENSE](LICENSE).

[travis-image]: https://img.shields.io/travis/vpdb/vpx-toolbox.svg?style=flat-square
[travis-url]: https://travis-ci.org/vpdb/vpx-toolbox
[dependencies-image]: https://david-dm.org/vpdb/vpx-toolbox.svg?style=flat-square
[dependencies-url]: https://david-dm.org/vpdb/vpx-toolbox
