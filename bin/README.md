# Command Line Tools

VPX-JS comes with command line tools. Make sure to run `npm run build` first, then change to the compiled output directory (`dist/cjs/bin`) when you use Node.js. Another option is transpile the TypeScript file on the fly and execute it using `npx ts-node bin/vptscript.ts`.

### Extract Table Script

To print the table script via CLI:

```bash
vptscript <source.vpx>
```

Using the API:

```js
const { Table } = require(`vpx-toolbox`);

(async () => {

	// parse the table
	const vpt = await Table.load('my-table.vpx');

	// read script
	const script = vpt.getTableScript();
	console.log(script);
})();
```

### Convert to GLTF

CLI:

```bash
vpt2glb <source.vpx> [<destination.glb>]
```

Additional options are `--compress-vertices`, `--skip-optimize`, `--no-textures`,
`--no-materials` and `--no-lights`. You can also skip generation of individual
item types by using `--no-primitives`, `--no-triggers`, `--no-kickers`, `--no-gates`,
`--no-targets`, `--no-flippers`, `--no-bumpers`, `--no-ramps`, `--no-surfaces`,
`--no-rubbers`, `--no-bulbs`, `--no-surface-lights` and `--no-playfield`.

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
with GLTF support as well, however it doesn't support the Dracos extensions, so
you'll need to disable mesh compression if you want to open it with 3D Viewer.

VPDB uses this to display 3D models in the browser:

![image](https://user-images.githubusercontent.com/70426/56841267-0419fc00-688d-11e9-9996-6d84070da392.png)

[Live version](https://vpdb.io/games/dk/releases/pkvazc1pw) (click on *3D View*)

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
