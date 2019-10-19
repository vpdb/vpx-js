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

	it('should transpile a single "Private" Const declaration', () => {
		const vbs = `Private Const test = 20\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('const test = 20;');
	});

	it('should transpile a multiple Const declaration', () => {
		const vbs = `Const test1 = 3.14, test2 = 4, test3 = -5.2, test4 = True, test5 = "STRING"\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal("const test1 = 3.14, test2 = 4, test3 = -5.2, test4 = true, test5 = 'STRING';");
	});

	it('should transpile a Const declaration with literal in parenthesis', () => {
		const vbs = `Const test1 = (5)\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('const test1 = 5;');
	});
});
