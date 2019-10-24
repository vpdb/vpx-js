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
import { vbsToJs } from '../../../test/script.helper';
import { Transformer } from '../transformer/transformer';

describe('The VBScript transpiler - Dim', () => {
	it('should transpile a single variable declaration', () => {
		const vbs = `Dim test1\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('let test1;');
	});

	it('should transpile a multiple variable declaration', () => {
		const vbs = `Dim test1, test2, test3\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('let test1, test2, test3;');
	});

	it('should transpile an empty dimension variable declaration', () => {
		const vbs = `Dim myarray()\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(`let myarray = ${Transformer.VBSHELPER_NAME}.dim([]);`);
	});

	it('should transpile a one-dimension variable declaration', () => {
		const vbs = `Dim myarray(200)\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(`let myarray = ${Transformer.VBSHELPER_NAME}.dim([200]);`);
	});

	it('should transpile a multi-dimension variable declaration', () => {
		const vbs = `Dim myarray(2,4,3)\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(`let myarray = ${Transformer.VBSHELPER_NAME}.dim([\n    2,\n    4,\n    3\n]);`);
	});

	it('should transpile multiple multi-dimension variable declaration', () => {
		const vbs = `Dim myarray(2,4,3), myarray2(3,4)\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(
			`let myarray = ${Transformer.VBSHELPER_NAME}.dim([\n        2,\n        4,\n        3\n    ]), myarray2 = ${Transformer.VBSHELPER_NAME}.dim([\n        3,\n        4\n    ]);`,
		);
	});
});
