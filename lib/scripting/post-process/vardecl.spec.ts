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
import { Grammar } from '../grammar/grammar';
import { Transformer } from '../transformer/transformer';

let grammar: Grammar;

before(async () => {
	grammar = new Grammar();
});

describe('The VBScript transpiler - Variable Declaration', () => {
	it('should transpile a single variable declaration', () => {
		const vbs = `Dim test1`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let test1;');
	});

	it('should transpile a multiple variable declaration', () => {
		const vbs = `Dim test1, test2, test3`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let test1, test2, test3;');
	});

	it('should transpile an empty dimension variable declaration', () => {
		const vbs = `Dim myarray()`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(`let myarray = ${Transformer.VBSHELPER_NAME}.dim([]);`);
	});

	it('should transpile a one-dimension variable declaration', () => {
		const vbs = `Dim myarray(200)`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(`let myarray = ${Transformer.VBSHELPER_NAME}.dim([200]);`);
	});

	it('should transpile a multi-dimension variable declaration', () => {
		const vbs = `Dim myarray(2,4,3)`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(`let myarray = ${Transformer.VBSHELPER_NAME}.dim([\n    2,\n    4,\n    3\n]);`);
	});

	it('should transpile multiple multi-dimension variable declaration', () => {
		const vbs = `Dim myarray(2,4,3), myarray2(3,4)`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			`let myarray = ${Transformer.VBSHELPER_NAME}.dim([\n        2,\n        4,\n        3\n    ]), myarray2 = ${Transformer.VBSHELPER_NAME}.dim([\n        3,\n        4\n    ]);`,
		);
	});

	it('should transpile a public variable declaration', () => {
		const vbs = `Public test1`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let test1;');
	});

	it('should transpile multiple public variable declarations', () => {
		const vbs = `public test1, test2`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let test1, test2;');
	});

	it('should transpile a public multi-dimension variable declaration', () => {
		const vbs = `public test(100, 200)`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(`let test = ${Transformer.VBSHELPER_NAME}.dim([\n    100,\n    200\n]);`);
	});

	it('should transpile a single private variable declaration', () => {
		const vbs = `Private test1`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let test1;');
	});

	it('should transpile multiple private variable declarations', () => {
		const vbs = `Private test1, test2`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let test1, test2;');
	});
});
