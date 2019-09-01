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

import { expect } from 'chai';
import { Mesh } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { ThreeHelper } from '../../../test/three.helper';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from './table';

const three = new ThreeHelper();

const tableWidth = 1111;
const tableHeight = 2222;
const tableDepth = 20;

describe('The VPinball table generator', () => {

	let gltf: GLTF;
	let vpt: Table;

	before(async () => {
		vpt = await Table.load(new NodeBinaryReader(three.fixturePath('table-empty.vpx')));
		gltf = await three.loadGlb(await vpt.exportGlb({ applyTextures: false, exportPlayfieldLights: false }));
	});

	it('should generate the correct playfield mesh', async () => {
		const playfieldMesh = three.first<Mesh>(gltf, 'playfield');
		const playfieldVertices = three.vertices(playfieldMesh);
		const expectedVertices = [tableWidth, 0, 0, 0, 0, 0, 0, tableHeight, 0, 0, tableHeight, 0, tableWidth, tableHeight, 0, tableWidth, 0, 0, 0, tableHeight, tableDepth, 0, 0, tableDepth, tableWidth, 0, tableDepth, tableWidth, 0, tableDepth, tableWidth, tableHeight, tableDepth, 0, tableHeight, tableDepth, tableWidth, 0, 0, tableWidth, tableHeight, 0, tableWidth, 0, tableDepth, tableWidth, tableHeight, 0, tableWidth, tableHeight, tableDepth, tableWidth, 0, tableDepth, tableWidth, tableHeight, 0, 0, tableHeight, 0, tableWidth, tableHeight, tableDepth, 0, tableHeight, 0, 0, tableHeight, tableDepth, tableWidth, tableHeight, tableDepth, 0, tableHeight, 0, 0, 0, 0, 0, tableHeight, tableDepth, 0, 0, 0, 0, 0, tableDepth, 0, tableHeight, tableDepth, 0, 0, 0, tableWidth, 0, 0, 0, 0, tableDepth, tableWidth, 0, 0, tableWidth, 0, tableDepth, 0, 0, tableDepth];
		expect(compareArray(playfieldVertices, expectedVertices)).to.equal(true);
	});

	it('should read the table script correctly', () => {
		const script = vpt.getTableScript();
		expect(script).to.equal(`Option Explicit\r\n`);
	});

	it('should read the table info correctly', async () => {
		expect(vpt.info!.TableRules).to.equal('Rules');
		expect(vpt.info!.AuthorName).to.equal('Table Author');
		expect(vpt.info!.TableName).to.equal('Table Name');
		expect(vpt.info!.TableBlurb).to.equal('Short Blurb');
		expect(vpt.info!.ReleaseDate).to.equal('2019-04-14');
		expect(vpt.info!.AuthorEmail).to.equal('test@vpdb.io');
		expect(vpt.info!.customdata1).to.equal('customvalue1');
		expect(vpt.info!.AuthorWebSite).to.equal('https://vpdb.io');
		expect(vpt.info!.TableVersion).to.equal('Version');
		expect(vpt.info!.TableDescription).to.equal('Description');
	});

	it('should not crash when reading a corrupt file', async () => {
		try {
			await Table.load(new NodeBinaryReader(three.fixturePath('table-corrupt.vpx')));
			expect.fail('Exception expected.');
		} catch (err) {
			// we're good in here
		}
	});

});

function compareArray(arr1: any[], arr2: any[]) {
	if (arr1.length !== arr2.length) {
		return false;
	}
	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) {
			return false;
		}
	}
	return true;
}
