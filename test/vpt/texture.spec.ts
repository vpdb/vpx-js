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

import { ThreeHelper } from '../three.helper';
import { Table } from '../../lib';

const gltfPipeline = require('gltf-pipeline');

const three = new ThreeHelper();
const processGltf = gltfPipeline.processGltf;

describe('The VPinball texture parser', () => {

	let glb: Buffer;

	before(async () => {
		const vpt = await Table.load(three.fixturePath('table-texture.vpx'));
		glb = await vpt.exportGlb({ optimizeTextures: false });
	});

	it('should convert an opaque png to jpeg');
	it('should correctly export a png');
	it('should correctly export a jpeg');
	it('should correctly export an lzw-compressed bitmap');
	it('should parse textures', async () => {
		const results = await processGltf(glb, { separate: true });
		for (const relativePath in results.separateResources) {
			if (results.separateResources.hasOwnProperty(relativePath)) {
				const resource = results.separateResources[relativePath];
				console.log(resource);
			}
		}
		console.log('done');
	});

});
