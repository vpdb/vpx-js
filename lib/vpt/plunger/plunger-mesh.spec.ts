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

import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

import { ThreeHelper } from '../../../test/three.helper';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table';

const three = new ThreeHelper();

describe('The VPinball plunger generator', () => {

	let gltf: GLTF;

	before(async () => {
		const vpt = await Table.load(new NodeBinaryReader(three.fixturePath('table-plunger.vpx')));
		gltf = await three.loadGlb(await vpt.exportGlb({ exportPlayfieldLights: true, applyTextures: false }));
	});

	it('should generate a flat plunger', async () => {
		three.expectObject(gltf, 'plungers', 'FlatPlunger', 'flat');
	});

	it('should generate a modern plunger', async () => {
		three.expectObject(gltf, 'plungers', 'ModernPlunger', 'spring');
		three.expectObject(gltf, 'plungers', 'ModernPlunger', 'rod');
	});

	it('should generate a custom plunger', async () => {
		three.expectObject(gltf, 'plungers', 'CustomPlunger', 'spring');
		three.expectObject(gltf, 'plungers', 'CustomPlunger', 'rod');
	});

});
