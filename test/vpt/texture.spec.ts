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
import { readFileSync, writeFileSync } from 'fs';
import { createDiff } from 'looks-same';
import * as sharp from 'sharp';
import { expect } from 'chai';
import looksSame = require('looks-same');

const three = new ThreeHelper();
const imgDiffTolerance = 7;

describe('The VPinball texture parser', () => {

	let vpt: Table;
	const testPng = readFileSync(three.fixturePath('test_pattern.png'));

	before(async () => {
		vpt = await Table.load(three.fixturePath('table-texture.vpx'));
	});

	it('should convert an opaque png to jpeg');
	it('should correctly export a png');

	it('should correctly export a jpeg', async () => {
		const texture = vpt.getTexture('test_pattern_jpg')!;
		const image = await texture.getImage(vpt);
		const jpg = await image.getImage(false, 100);
		const png = await sharp(jpg).png().toBuffer();
		const match = await comparePngs(png, testPng);
		expect(match).to.equal(true);
	});


	it('should correctly export an lzw-compressed bitmap', async () => {
		const texture = vpt.getTexture('test_pattern_bmp')!;
		const image = await texture.getImage(vpt);
		const jpg = await image.getImage(false, 100);
		const png = await sharp(jpg).png().toBuffer();
		const match = await comparePngs(png, testPng);
		expect(match).to.equal(true);
	});

});

async function comparePngs(img1: Buffer, img2: Buffer, debugPrint = false): Promise<boolean> {
	return new Promise((resolve, reject) => {
		looksSame(img1, img2, { tolerance: imgDiffTolerance, ignoreAntialiasing: false, ignoreCaret: false }, (error, result) => {
			if (error) {
				return reject(error);
			}
			if (debugPrint) {
				console.log(JSON.stringify(result, null, '  '));
			}
			resolve(result.equal);
		});
	});
}

async function debug(img1: Buffer, img2: Buffer) {
	await comparePngs(img1, img2);
	await new Promise((resolve, reject) => {
		createDiff({
			reference: img1,
			current: img2,
			diff: 'diff.png',
			highlightColor: '#ff00ff', // color to highlight the differences
			strict: false,
			tolerance: imgDiffTolerance,
			antialiasingTolerance: 0,
			ignoreAntialiasing: false,
			ignoreCaret: false
		}, error => error ? reject(error) : resolve());
	});
	writeFileSync('texture.png', img1);
	writeFileSync('fixture.png', img2);
}
