#!/usr/bin/env node
/*
 * VPDB - Virtual Pinball Database
 * Copyright (C) 2019 freezy <freezy@vpdb.io>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { existsSync, writeFileSync } from 'fs';
import { basename, dirname, resolve } from 'path';
import { Table } from '../lib';

(async () => {

	try {

		const argSrc = process.argv[2];
		const argDest = process.argv[3];

		const start = Date.now();
		if (!argSrc) {
			console.log('Converts a Visual Pinball table to a binary GLTF model.\n\nUSAGE: vpt2glb <source.vpx> [<dest.glb>]\n');
			return;
		}
		if (!/\.vp[xt]$/i.test(argSrc)) {
			throw new Error('First argument must be a .vpx or .vpt file.');
		}
		const vpxPath = resolve(argSrc);
		if (!existsSync(vpxPath)) {
			throw new Error(`The file "${vpxPath}" does not exist.`);
		}
		let glbPath: string;
		if (argDest) {
			if (!/\.glb$/i.test(argDest)) {
				throw new Error('Second file\'s extension must be .glb.');
			}
			glbPath = resolve(argDest);
			if (!existsSync(dirname(glbPath))) {
				throw new Error(`The folder where to write ${glbPath} does not exist.`);
			}
		} else {
			const name = basename(vpxPath).split('.').slice(0, -1).join('.') + '.glb';
			glbPath = resolve(dirname(vpxPath), name);
		}


		console.log('Parsing file from %s...', vpxPath);
		const vpt = await Table.load(vpxPath);
		const loaded = Date.now();

		console.log('Exporting file to %s...', glbPath);
		const glb = await vpt.exportGlb({

			applyTextures: true,
			applyMaterials: true,
			exportLightBulbLights: true,
			optimizeTextures: true,
			gltfOptions: { compressVertices: false, forcePowerOfTwoTextures: true },

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
		const exported = Date.now();
		writeFileSync(glbPath, glb);

		console.log('Done! Written %s MB. Load time: %sms, export time: %sms, write time: %sms.',
			Math.round(glb.length / 100000) / 10, loaded - start, exported - loaded, Date.now() - exported);

	} catch (err) {
		console.error(`ERROR: ${err.message}`);

	} finally {
		process.exit();
	}

})();
