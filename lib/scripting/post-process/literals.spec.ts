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

describe('The VBScript transpiler - Literals', () => {
	it('should transpile an "Int" assignment', () => {
		const vbs = `value = 10\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('value = 10;');
	});

	it('should transpile a "Float" assignment', () => {
		const vbs = `pi = 3.14\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('pi = 3.14;');
	});

	it('should transpile "String" assignments', () => {
		const vbs = `test1 = "STRING"\ntest2 = """QUOTES"""\ntest3 = "'APOSTROPHE'"\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal("test1 = 'STRING';\ntest2 = '\"QUOTES\"';\ntest3 = '\\'APOSTROPHE\\'';");
	});

	it('should transpile "Boolean" assignments', () => {
		const vbs = `success = True\nsuccess = False\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('success = true;\nsuccess = false;');
	});

	it('should transpile "Hexadecimal" assignments', () => {
		const vbs = `test1 = &H0A&\ntest2 = &H0D\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('test1 = 10;\ntest2 = 13;');
	});

	it('should transpile "Octal" assignments', () => {
		const vbs = `test1 = &47&\ntest2 = &57\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('test1 = 39;\ntest2 = 47;');
	});

	it('should transpile a "Nothing" assignment', () => {
		const vbs = `test1 = Nothing\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('test1 = null;');
	});

	it('should transpile a "Null" assignments', () => {
		const vbs = `test1 = Null\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('test1 = null;');
	});

	it('should transpile an "Empty" assignments', () => {
		const vbs = `test1 = Empty\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('test1 = null;');
	});

	it('should transpile "Date" assignments', () => {
		const vbs = `test1 = #31-Dec-1999 21:26:00#\ntest2 = #12/31/1999 9:26:00 PM#\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal("test1 = new Date('31-Dec-1999 21:26:00');\ntest2 = new Date('12/31/1999 9:26:00 PM');");
	});
});
