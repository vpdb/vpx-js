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

describe('The VBScript transpiler - Loop', () => {
	it('should transpile a "Do While...Loop" statement', () => {
		const vbs = `Dim x\nx = 1\nDo While x < 5\nx = x + 1\nLoop\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('let x;\nx = 1;\nwhile (x < 5) {\n    x = x + 1;\n}');
	});

	it('should transpile a "Do Until...Loop" statement', () => {
		const vbs = `Dim x\nx = 1\nDo Until x = 5\nx = x + 1\nLoop\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('let x;\nx = 1;\ndo {\n    if (x == 5) {\n        break;\n    }\n    x = x + 1;\n} while (true);');
	});

	it('should transpile a "Do...Loop While" statement', () => {
		const vbs = `Dim x\nx = 7\nDo\nx = x + 1\nLoop While x < 5\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('let x;\nx = 7;\ndo {\n    x = x + 1;\n} while (x < 5);');
	});

	it('should transpile a "Do...Loop Until" statement', () => {
		const vbs = `Dim i\ni = 10\nDo\ni = i + 1\nLoop Until i < 15\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('let i;\ni = 10;\ndo {\n    i = i + 1;\n    if (i < 15) {\n        break;\n    }\n} while (true);');
	});

	it('should transpile a "Do...Loop" statement', () => {
		const vbs = `Dim x\nx = 7\nDo\nx = x + 1\nLoop\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('let x;\nx = 7;\ndo {\n    x = x + 1;\n} while (true);');
	});

	it('should transpile a "While...WEnd" statement', () => {
		const vbs = `Dim x\nx = 1\nWhile x < 5\nx = x + 1\nWEnd\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('let x;\nx = 1;\nwhile (x < 5) {\n    x = x + 1;\n}');
	});
});
