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

const three = new ThreeHelper();
const scale = 0.05;

describe('The VPinball lights generator', () => {

	let gltf: GLTF;

	before(async () => {
		const vpt = await Table.load(three.fixturePath('table-light.vpx'));
		gltf = await three.loadGlb(await vpt.exportGlb());
	});

	it('should generate a static light bulb mesh', async () => {
		three.expectObject(gltf, 'lightsBulbs', 'bulblight-StaticBulb');
	});

	it('should generate a light bulb mesh', async () => {
		three.expectObject(gltf, 'lightsBulbs', 'bulblight-Bulb');
	});

	it('should generate a scaled light bulb mesh', async () => {
		// TODO find a way to test scaling (vpx obj export doesn't export light bulbs)
		three.expectObject(gltf, 'lightsBulbs', 'bulblight-Scaled');
	});

	it('should generate a light bulb mesh on a surface', async () => {
		// TODO find a way to test (vpx obj export doesn't export light bulbs)
		three.expectObject(gltf, 'lightsBulbs', 'bulblight-Surface');
	});

	it('should not generate a light bulb with no bulb mesh', async () => {
		three.expectNoObject(gltf, 'lightsBulbs', 'bulblight-NoBulb');
	});

	it('should not generate a light with no bulb mesh', async () => {
		three.expectNoObject(gltf, 'lights', 'light-NoBulb');
	});

	it('should generate a light with default parameters', async () => {
		const light = three.find<SpotLight>(gltf, 'lights', 'lightStaticBulb');
		expect(light.decay).to.equal(2);
		expect(light.intensity).to.equal(1);
		expect(light.distance).to.equal(scale * 50);
		expect(light.color.r).to.equal(1);
		expect(light.color.g).to.equal(1);
		expect(light.color.b).to.equal(0);
	});

	it('should generate a light with custom parameters', async () => {
		const light = three.find<SpotLight>(gltf, 'lights', 'lightCustomParams');
		expect(light.decay).to.equal(2);
		expect(Math.round(light.intensity * 1000) / 1000).to.equal(5.2);
		expect(Math.round(light.distance * 1000) / 1000).to.equal(scale * 64.1);
		expect(light.color.r).to.equal(0.34901960784313724);
		expect(light.color.g).to.equal(0.9333333333333333);
		expect(light.color.b).to.equal(0.06666666666666667);
	});
});
