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
import { vbsToJs } from '../../test/script.helper';

describe('The VBScript transpiler - Const', () => {
	it('should transpile a single Const declaration', () => {
		const vbs = `Const pi = 3.14\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('const pi = 3.14;');
	});

	it('should transpile a multiple Const declaration', () => {
		const vbs = `Const test1 = 3.14, test2 = 4, test3 = -5.2\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('const test1 = 3.14, test2 = 4, test3 = -5.2;');
	});

	it('should transpile a Const declaration with string values', () => {
		const vbs = `Const test1 = "STRING", test2 = """QUOTES""", test3 = "'APOSTROPHE'"\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal("const test1 = 'STRING', test2 = '\"QUOTES\"', test3 = '\\'APOSTROPHE\\'';");
	});

	it('should transpile a Const declaration with boolean values', () => {
		const vbs = `Const test1 = True, test2 = False, test3 = true, test4 = false\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('const test1 = true, test2 = false, test3 = true, test4 = false;');
	});

	it('should transpile a Const declaration with hexadecimal values', () => {
		const vbs = `Const test1 = &H0A&, test2 = &H0D&\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('const test1 = 10, test2 = 13;');
	});

	it('should transpile a Const declaration with octal values', () => {
		const vbs = `Const test1 = &47&, test2 = &57&\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('const test1 = 39, test2 = 47;');
	});
});
