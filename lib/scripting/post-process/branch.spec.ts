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

describe('The VBScript transpiler - Branch', () => {
	it('should transpile an Exit Sub', () => {
		const vbs = `If mTimers = 0 Then x = 5 : Exit Sub`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(`if (mTimers == 0) {\n    x = 5;\n    return;\n}`);
	});

	it('should transpile an Exit Function', () => {
		const vbs = `Function test(x)\nIf x = 1 Then Exit Function\nx = 5\nEnd Function`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			`function test(x) {\n    let test = undefined;\n    if (x == 1) {\n        return test;\n    }\n    x = 5;\n    return test;\n}`,
		);
	});

	it('should transpile an Exit For', () => {
		const vbs = `For j = 1 To 20 Step x\nIf j = 10 Then Exit For\nNext`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			`for (j = 1; x < 0 ? j >= 20 : j <= 20; j += x) {\n    if (j == 10) {\n        break;\n    }\n}`,
		);
	});
});
