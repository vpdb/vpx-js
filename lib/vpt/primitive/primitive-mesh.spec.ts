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

import { Mesh } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { ThreeHelper } from '../../../test/three.helper';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';

const three = new ThreeHelper();

describe('The VPinball primitive generator', () => {

	let gltf: GLTF;

	before(async () => {
		const vpt = await Table.load(new NodeBinaryReader(three.fixturePath('table-primitive.vpx')));
		gltf = await three.loadGlb(await vpt.exportGlb({ applyTextures: false }));
	});

	it('should generate a simple primitive mesh', async () => {
		const cubeMesh = three.find<Mesh>(gltf, 'primitives', 'Cube', 'primitive-Cube');
		const cubeMeshVertices = three.vertices(cubeMesh);
		const expectedVertices = [
			[600.000000, 600.000000, 100.000000],
			[400.000000, 600.000000, 100.000000],
			[400.000000, 600.000000, -100.000000],
			[600.000000, 600.000000, -100.000000],
			[600.000000, 400.000000, -100.000000],
			[600.000000, 600.000000, -100.000000],
			[400.000000, 600.000000, -100.000000],
			[400.000000, 400.000000, -100.000000],
			[400.000000, 400.000000, -100.000000],
			[400.000000, 600.000000, -100.000000],
			[400.000000, 600.000000, 100.000000],
			[400.000000, 400.000000, 100.000000],
			[400.000000, 400.000000, 100.000000],
			[600.000000, 400.000000, 100.000000],
			[600.000000, 400.000000, -100.000000],
			[400.000000, 400.000000, -100.000000],
			[600.000000, 400.000000, 100.000000],
			[600.000000, 600.000000, 100.000000],
			[600.000000, 600.000000, -100.000000],
			[600.000000, 400.000000, -100.000000],
			[400.000000, 400.000000, 100.000000],
			[400.000000, 600.000000, 100.000000],
			[600.000000, 600.000000, 100.000000],
			[600.000000, 400.000000, 100.000000],
		];
		three.expectVerticesInArray(expectedVertices, cubeMeshVertices);
	});

	it('should generate a simple generated mesh', async () => {
		const triangleMesh = three.find<Mesh>(gltf, 'primitives', 'Triangle', 'primitive-Triangle');
		const triangleMeshVertices = three.vertices(triangleMesh);
		const expectedVertices = [
			[526.975952, 913.236511, -246.442444],
			[536.197876, 831.975708, -188.895538],
			[479.393341, 907.225647, -334.190735],
			[565.336609, 1000.508118, -216.241028],
			[440.645935, 935.510925, -201.154724],
			[449.867889, 854.250183, -143.607819],
			[393.063324, 929.500061, -288.903015],
			[479.006622, 1022.782532, -170.953308],
			[536.197876, 831.975708, -188.895538],
			[479.393341, 907.225647, -334.190735],
			[565.336609, 1000.508118, -216.241028],
			[449.867889, 854.250183, -143.607819],
			[393.063324, 929.500061, -288.903015],
			[479.006622, 1022.782532, -170.953308],
		];
		three.expectVerticesInArray(expectedVertices, triangleMeshVertices);
	});

	it('should generate an uncompressed mesh');

	it('should generate a compressed mesh', async () => {

		const vptSink = await Table.load(new NodeBinaryReader(three.fixturePath('table-sink.vpx')));
		const gltfSink = await three.loadGlb(await vptSink.exportGlb());

		const sinkMesh = three.find<Mesh>(gltfSink, 'primitives', 'Primitive1', 'primitive-Primitive1');
		const sinkMeshVertices = three.vertices(sinkMesh);
		const expectedVertices = [
			[450.063995, 1123.057007, -85.772011],
			[445.540009, 1124.269043, -85.772011],
			[446.127014, 1125.284058, -83.379013],
			[450.063995, 1124.229004, -83.379013],
			[445.540009, 1124.269043, -85.772011],
			[442.229004, 1127.579956, -85.772011],
			[443.243988, 1128.166016, -83.379013],
			[448.869995, 1137.740967, -112.537010],
			[448.154999, 1137.498047, -112.537010],
			[448.346985, 1137.036011, -112.484009],
			[449.000000, 1137.258057, -112.484009],
			[447.959015, 1137.969971, -112.565010],
			[448.738007, 1138.234985, -112.565010],
			[450.364990, 1137.937012, -112.537010],
			[449.610992, 1137.888062, -112.537010],
			[449.677002, 1137.391968, -112.484009],
			[450.364990, 1137.437012, -112.484009],
			[449.544006, 1138.395020, -112.565010],
			[450.364990, 1138.448975, -112.565010],
			[451.014008, 1132.209961, -110.806007],
			[451.013000, 1132.200073, -110.811012],
			[451.014008, 1132.213013, -110.834007],
			[451.015015, 1132.218018, -110.828011],
			[451.016998, 1132.223999, -110.821007],
			[451.011993, 1132.200073, -110.820007],
			[451.013000, 1132.200073, -110.811012],
			[451.007996, 1132.200073, -110.828011],
			[451.005005, 1132.198975, -110.832016],
			[451.013000, 1132.207031, -110.835007],
			[451.005005, 1132.209961, -110.832016],
			[451.013000, 1132.201050, -110.835007],
			[451.014008, 1132.193970, -110.834007],
			[473.041992, 1098.006958, -4.743007],
			[473.070007, 1098.000977, -4.976007],
			[473.144012, 1098.277954, -4.976007],
			[473.117004, 1098.287964, -4.743007],
			[473.003998, 1097.427002, -4.743007],
			[473.032990, 1097.428955, -4.976007],
			[473.032990, 1097.716064, -4.976007],
			[473.003998, 1097.718018, -4.743007],
			[473.117004, 1096.856934, -4.743007],
			[473.144012, 1096.866943, -4.976007],
			[473.070007, 1097.144043, -4.976007],
			[473.041992, 1097.137939, -4.743007],
			[453.544006, 1103.154053, -187.951019],
			[453.674011, 1103.118042, -187.956024],
			[453.697998, 1103.104004, -187.958008],
			[453.683014, 1103.104004, -187.956024],
			[453.544006, 1103.154053, -187.951019],
			[453.683014, 1103.104004, -187.956024],
			[453.705994, 1103.088989, -187.957016],
			[453.687012, 1103.091064, -187.956024],
			[453.544006, 1103.154053, -187.951019],
			[453.687012, 1103.091064, -187.956024],
			[453.707001, 1103.076050, -187.957016],
			[453.665009, 1103.092041, -187.954025],
			[453.544006, 1103.154053, -187.951019],

		];
		three.expectVerticesInArray(expectedVertices, sinkMeshVertices);
	});

	it('should assign the correct material');
});
