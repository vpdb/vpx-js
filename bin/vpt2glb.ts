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
import { NodeBinaryReader } from '../lib/io/binary-reader.node';
import { TableExporter } from '../lib/vpt/table/table-exporter';
import { Logger } from '../lib/util/logger';
import { Table } from '../lib/vpt/table/table';
import { ThreeTextureLoaderNode } from '../lib/render/threejs/three-texture-loader-node';

(async () => {

	try {

		const argSrc = process.argv[2];
		const argDest = process.argv[3];

		// other options
		const compressVertices = process.argv.includes('--compress-vertices');
		const optimizeTextures = !process.argv.includes('--skip-optimize');
		const applyTextures = !process.argv.includes('--no-textures') ? new ThreeTextureLoaderNode() : undefined;
		const applyMaterials = !process.argv.includes('--no-materials');
		const exportLightBulbLights = !process.argv.includes('--no-lights');

		const exportPrimitives = !process.argv.includes('--no-primitives');
		const exportTriggers = !process.argv.includes('--no-triggers');
		const exportKickers = !process.argv.includes('--no-kickers');
		const exportGates = !process.argv.includes('--no-gates');
		const exportHitTargets = !process.argv.includes('--no-targets');
		const exportFlippers = !process.argv.includes('--no-flippers');
		const exportBumpers = !process.argv.includes('--no-bumpers');
		const exportRamps = !process.argv.includes('--no-ramps');
		const exportSurfaces = !process.argv.includes('--no-surfaces');
		const exportRubbers = !process.argv.includes('--no-rubbers');
		const exportLightBulbs = !process.argv.includes('--no-bulbs');
		const exportPlayfieldLights = !process.argv.includes('--no-surface-lights');
		const exportPlayfield = !process.argv.includes('--no-playfield');
		const exportPlungers = !process.argv.includes('--no-plungers');
		const exportSpinners = !process.argv.includes('--no-spinners');

		// silence logs
		Logger.setLogger({
			debug(format: any, ...param: any[]): void {},
			error(format: any, ...param: any[]): void {},
			info(format: any, ...param: any[]): void {},
			verbose(format: any, ...param: any[]): void {},
			warn(format: any, ...param: any[]): void {},
			wtf(format: any, ...param: any[]): void {}
		});

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
		const table = await Table.load(new NodeBinaryReader(vpxPath));
		const exporter = new TableExporter(table);
		const loaded = Date.now();

		console.log('Exporting file to %s...', glbPath);
		const glb = await exporter.exportGlb({

			applyTextures,
			applyMaterials,
			exportLightBulbLights,
			optimizeTextures,
			gltfOptions: { compressVertices, forcePowerOfTwoTextures: true },

			exportPrimitives,
			exportTriggers,
			exportKickers,
			exportGates,
			exportHitTargets,
			exportFlippers,
			exportBumpers,
			exportRamps,
			exportSurfaces,
			exportRubbers,
			exportLightBulbs,
			exportPlayfieldLights,
			exportPlayfield,
			exportPlungers,
			exportSpinners,
		});
		const exported = Date.now();
		writeFileSync(glbPath, glb);

		console.log('Done! Written %s MB. Load time: %sms, export time: %sms, write time: %sms.',
			Math.round(glb.length / 100000) / 10, loaded - start, exported - loaded, Date.now() - exported);

	} catch (err) {
		console.error(err);

	} finally {
		process.exit();
	}

})();
