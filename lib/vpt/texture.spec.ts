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
import { readFileSync, writeFileSync } from 'fs';
import { createDiff } from 'looks-same';
import looksSame = require('looks-same');
import * as sharp from 'sharp';
import { NodeBinaryReader } from '../../lib/io/binary-reader.node';
import { ThreeTextureLoaderNode } from '../../lib/render/threejs/three-texture-loader-node';
import { Table } from '../../lib/vpt/table/table';
import { ThreeHelper } from '../../test/three.helper';

const three = new ThreeHelper();
const imgDiffTolerance = 7;

describe('The VPinball texture parser', () => {

	let vpt: Table;
	const loader = new ThreeTextureLoaderNode();
	const testPng = readFileSync(three.fixturePath('test_pattern.png'));
	const testPngPow2 = readFileSync(three.fixturePath('test_pattern_pow2.png'));
	const testPngTransparent = readFileSync(three.fixturePath('test_pattern_transparent.png'));
	const testPngOptimized = readFileSync(three.fixturePath('test_pattern_optimized.png'));
	const testLocalGottliebKicker = readFileSync(three.resPath('kickerGottlieb.png'));

	before(async () => {
		vpt = await Table.load(new NodeBinaryReader(three.fixturePath('table-texture.vpx')));
	});

	it('should correctly export a png', async () => {
		const texture = vpt.getTexture('test_pattern_transparent')!;
		const threeTexture = await texture.loadTexture(loader, vpt);
		const png = await threeTexture.image.getImage(false);
		const match = await comparePngs(png, testPngTransparent, 10, true);
		expect(match).to.equal(true);
	});

	it('should convert an opaque png to jpeg', async () => {
		const texture = vpt.getTexture('test_pattern_png')!;
		const threeTexture = await texture.loadTexture(loader, vpt);
		const jpg = await threeTexture.image.getImage(false, 100);
		const png = await sharp(jpg).png().toBuffer();
		const match = await comparePngs(png, testPng);
		expect(match).to.equal(true);
	});

	it('should correctly export a jpeg', async () => {
		const texture = vpt.getTexture('test_pattern_jpg')!;
		const threeTexture = await texture.loadTexture(loader, vpt);
		const jpg = await threeTexture.image.getImage(false, 100);
		const png = await sharp(jpg).png().toBuffer();
		const match = await comparePngs(png, testPng);
		expect(match).to.equal(true);
	});

	it('should correctly export an lzw-compressed bitmap', async () => {
		const texture = vpt.getTexture('test_pattern_xrgb')!;
		const threeTexture = await texture.loadTexture(loader, vpt);
		const jpg = await threeTexture.image.getImage(false, 100);
		const png = await sharp(jpg).png().toBuffer();
		const match = await comparePngs(png, testPng);
		expect(match).to.equal(true);
	});

	it('should correctly export an lzw-compressed xrgba bitmap', async () => {
		const texture = vpt.getTexture('test_pattern_argb')!;
		const threeTexture = await texture.loadTexture(loader, vpt);
		const jpg = await threeTexture.image.getImage(false, 100);
		const png = await sharp(jpg).png().toBuffer();
		const match = await comparePngs(png, testPng);
		expect(match).to.equal(true);
	});

	it('should resize an image to power of two', async () => {
		const texture = vpt.getTexture('test_pattern_png')!;
		const threeTexture = await texture.loadTexture(loader, vpt);
		threeTexture.image.resize(1024, 512);
		const jpg = await threeTexture.image.getImage(false, 100);
		const png = await sharp(jpg).png().toBuffer();
		const match = await comparePngs(png, testPngPow2, 20);
		expect(match).to.equal(true);
	});

	it('should optimize a png', async () => {
		const texture = vpt.getTexture('test_pattern_transparent')!;
		const threeTexture = await texture.loadTexture(loader, vpt);
		const png = await threeTexture.image.getImage(true);
		const match = await comparePngs(png, testPngOptimized, 30, true);
		//expect(match).to.equal(true); fuck you pngcrush
	});

	it('should correctly export a HDR environment map', async () => {
		const texture = vpt.getTexture('test_pattern_hdr')!;
		const threeTexture = await texture.loadTexture(loader, vpt);
		expect(threeTexture.image.width).to.equal(1024);
		expect(threeTexture.image.height).to.equal(512);
		expect(threeTexture.image.data.length).to.equal(2097152);
	});

	it('should correctly export a EXR environment map', async () => {
		const texture = vpt.getTexture('test_pattern_exr')!;
		const threeTexture = await texture.loadTexture(loader, vpt);
		expect(threeTexture.image.width).to.equal(587);
		expect(threeTexture.image.height).to.equal(675);
		expect(threeTexture.image.data.length).to.equal(1584900);
	});

	it('should correctly export a local texture', async () => {
		const kicker = vpt.kickers.Kicker1;
		const kickerMeshes = kicker.getMeshes(vpt);
		const threeTexture = await kickerMeshes.kicker.map!.loadTexture(loader, vpt);
		expect(threeTexture.image.width).to.equal(256);
		expect(threeTexture.image.height).to.equal(256);

		const jpg = await threeTexture.image.getImage(false, 100);
		const png = await sharp(jpg).png().toBuffer();
		const match = await comparePngs(png, testLocalGottliebKicker);
		expect(match).to.equal(true);
	});

});

async function comparePngs(img1: Buffer, img2: Buffer, tolerance = imgDiffTolerance, ignoreAntialiasing = false, debugPrint = false): Promise<boolean> {
	return new Promise((resolve, reject) => {
		looksSame(img1, img2, { tolerance, ignoreAntialiasing, ignoreCaret: false }, (error, result) => {
			if (error) {
				return reject(error);
			}
			if (debugPrint) {
				// tslint:disable-next-line:no-console
				console.log(JSON.stringify(result, null, '  '));
			}
			resolve(result.equal);
		});
	});
}

async function debug(img1: Buffer, img2: Buffer, tolerance = imgDiffTolerance, ignoreAntialiasing = false) {
	await comparePngs(img1, img2, tolerance, ignoreAntialiasing, true);
	await new Promise((resolve, reject) => {
		createDiff({
			reference: img1,
			current: img2,
			diff: 'diff.png',
			highlightColor: '#ff00ff', // color to highlight the differences
			strict: false,
			tolerance,
			antialiasingTolerance: 0,
			ignoreAntialiasing,
			ignoreCaret: false,
		}, error => error ? reject(error) : resolve());
	});
	writeFileSync('texture.png', img1);
	writeFileSync('fixture.png', img2);
}
