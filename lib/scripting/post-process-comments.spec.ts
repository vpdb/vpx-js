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

describe('The VBScript transpiler - Comments', () => {
	it('should transpile a comment', () => {
		const vbs = `'This is a "test" 'comment';\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(';    //This is a "test" \'comment\';\n');
	});

	it('should transpile a comment preceeded by whitespace', () => {
		const vbs = `  ' This is a "test" 'comment';\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(';    // This is a "test" \'comment\';\n');
	});

	it('should transpile an inline statement comment', () => {
		const vbs = `x = 5 ' This is a "test" 'comment';\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('x = 5;    // This is a "test" \'comment\';\n');
	});

	it('should transpile multiple comments', () => {
		const vbs = `' Line 1\n'Line 2\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(';    // Line 1\n;    //Line 2\n');
	});

	it('should transpile multiple comments separated by new lines and whitespaces', () => {
		const vbs = `' Line 1\n\n   \n\n   'Line 2\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(';    // Line 1\n;    //Line 2\n');
	});
});
