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

import { SpotLight } from 'three';
import { expect } from 'chai';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

import { ThreeHelper } from '../three.helper';
import { Table } from '../../lib';
import { NodeBinaryReader } from '../../lib/io/binary-reader.node';

const three = new ThreeHelper();
const scale = 0.05;

describe('The VPinball lights generator', () => {

	let gltf: GLTF;

	before(async () => {
		const vpt = await Table.load(new NodeBinaryReader(three.fixturePath('table-light.vpx')));
		gltf = await three.loadGlb(await vpt.exportGlb({ exportPlayfieldLights: true, applyTextures: false }));
	});

	it('should generate a static light bulb mesh', async () => {
		three.expectObject(gltf, 'lightBulbs', 'StaticBulb', 'bulblight-StaticBulb');
	});

	it('should generate a light bulb mesh', async () => {
		three.expectObject(gltf, 'lightBulbs', 'Bulb', 'bulblight-Bulb');
	});

	it('should generate a scaled light bulb mesh', async () => {
		// TODO find a way to test scaling (vpx obj export doesn't export light bulbs)
		three.expectObject(gltf, 'lightBulbs', 'Scaled', 'bulblight-Scaled');
	});

	it('should generate a light bulb mesh on a surface', async () => {
		// TODO find a way to test (vpx obj export doesn't export light bulbs)
		three.expectObject(gltf, 'lightBulbs', 'Surface', 'bulblight-Surface');
	});

	it('should not generate a light bulb with no bulb mesh', async () => {
		three.expectNoObject(gltf, 'lightBulbs', 'NoBulb');
	});

	it('should not generate a light with no bulb mesh', async () => {
		three.expectNoObject(gltf, 'lights', 'NoBulb');
	});

	it('should generate a light with default parameters', async () => {
		const light = three.find<SpotLight>(gltf, 'lights', 'StaticBulb', 'lightStaticBulb');
		expect(light.decay).to.equal(2);
		expect(light.intensity).to.equal(1);
		expect(light.distance).to.equal(scale * 50);
		expect(light.color.r).to.equal(1);
		expect(light.color.g).to.equal(1);
		expect(light.color.b).to.equal(0);
	});

	it('should generate a light with custom parameters', async () => {
		const light = three.find<SpotLight>(gltf, 'lights', 'CustomParams', 'lightCustomParams');
		expect(light.decay).to.equal(2);
		expect(Math.round(light.intensity * 1000) / 1000).to.equal(5.2);
		expect(Math.round(light.distance * 1000) / 1000).to.equal(scale * 64.1);
		expect(light.color.r).to.equal(0.34901960784313724);
		expect(light.color.g).to.equal(0.9333333333333333);
		expect(light.color.b).to.equal(0.06666666666666667);
	});

	it('should generate a mesh for a light with the same texture as the playfield', async () => {
		three.expectObject(gltf, 'playfieldLights', 'PlayfieldLight', 'surfacelight-PlayfieldLight');
	});

	it('should generate a mesh for a light with the same texture as a surface', async () => {
		three.expectObject(gltf, 'playfieldLights', 'SurfaceLight', 'surfacelight-SurfaceLight');
	});

	it('should generate a mesh for a light that has the same texture as three other lights', async () => {
		three.expectObject(gltf, 'playfieldLights', 'SurfaceLightCollection', 'surfacelight-SurfaceLightCollection');
	});

});
