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

import * as chai from 'chai';
import { expect } from 'chai';
import { VBSHelper } from './vbs-helper';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting VBS Helper', () => {
	const vbsHelper = new VBSHelper();

	it('should create a one-dimension array', () => {
		const js = vbsHelper.dim([100]);
		expect(js.length).to.equal(101);
	});

	it('should reduce a one-dimension array', () => {
		let js = vbsHelper.dim([100]);
		js = vbsHelper.redim(js, [50]);
		expect(js.length).to.equal(51);
	});

	it('should reduce and preserve a one-dimension array', () => {
		let js = vbsHelper.dim([100]);
		js[50] = 'Test';
		js[51] = 'Test';
		js = vbsHelper.redim(js, [50], true);
		expect(js[50]).to.equal(`Test`);
		expect(js[51]).to.equal(undefined);
		expect(js.length).to.equal(51);
	});

	it('should expand a one-dimension array', () => {
		let js = vbsHelper.dim([100]);
		js[100] = 'Test';
		js = vbsHelper.redim(js, [150]);
		expect(js[100]).to.equal(undefined);
		expect(js.length).to.equal(151);
	});

	it('should expand and preserve a one-dimension array', () => {
		let js = vbsHelper.dim([100]);
		js[100] = 'Test';
		js = vbsHelper.redim(js, [150], true);
		expect(js[100]).to.equal(`Test`);
		expect(js.length).to.equal(151);
	});

	it('should create a three-dimension array', () => {
		const js = vbsHelper.dim([4, 3, 2]);
		expect(js.length).to.equal(5);
		expect(js[0].length).to.equal(4);
		expect(js[0][0].length).to.equal(3);
	});

	it('should test upper bounds of a three-dimension array', () => {
		expect(() => {
			const js = vbsHelper.dim([4, 3, 2]);
			js[4][4][2] = 'Test';
		}).to.throw(`Cannot set property '2' of undefined`);
	});

	it('should test invalid dimension change of a three-dimension array', () => {
		expect(() => {
			let js = vbsHelper.dim([4, 3, 2]);
			js = vbsHelper.redim(js, [4, 4, 2]);
		}).to.throw(`Only last dimension can be changed`);
	});

	it('should reduce a three-dimension array', () => {
		let js = vbsHelper.dim([2, 2, 3]);
		js[0][0][1] = 'Test';
		js[0][0][2] = 'Test';
		js = vbsHelper.redim(js, [2, 2, 1]);
		for (let index1 = 0; index1 <= 2; index1++) {
			for (let index2 = 0; index2 <= 2; index2++) {
				expect(js[index1][index2].length).to.equal(2);
			}
		}
		expect(js[0][0][1]).to.equal(undefined);
		expect(js[0][0][2]).to.equal(undefined);
	});

	it('should reduce and preserve a three-dimension array', () => {
		let js = vbsHelper.dim([2, 2, 3]);
		js[0][0][1] = 'Test';
		js[0][0][2] = 'Test';
		js = vbsHelper.redim(js, [2, 2, 1], true);
		for (let index1 = 0; index1 <= 2; index1++) {
			for (let index2 = 0; index2 <= 2; index2++) {
				expect(js[index1][index2].length).to.equal(2);
			}
		}
		expect(js[0][0][1]).to.equal(`Test`);
		expect(js[0][0][2]).to.equal(undefined);
	});

	it('should expand a three-dimension array', () => {
		let js = vbsHelper.dim([2, 2, 3]);
		js[0][0][3] = 'Test';
		js = vbsHelper.redim(js, [2, 2, 4]);
		expect(js[0][0][3]).to.equal(undefined);
		for (let index1 = 0; index1 <= 2; index1++) {
			for (let index2 = 0; index2 <= 2; index2++) {
				expect(js[index1][index2].length).to.equal(5);
			}
		}
	});

	it('should expand and preserve a three-dimension array', () => {
		let js = vbsHelper.dim([2, 2, 3]);
		js[0][0][3] = 'Test';
		js = vbsHelper.redim(js, [2, 2, 4], true);
		expect(js[0][0][3]).to.equal(`Test`);
		for (let index1 = 0; index1 <= 2; index1++) {
			for (let index2 = 0; index2 <= 2; index2++) {
				expect(js[index1][index2].length).to.equal(5);
			}
		}
	});
});
