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

let grammar: Grammar;

before(async () => {
	grammar = new Grammar();
});

describe('The VBScript transpiler - Literal', () => {
	it('should transpile an "Int" assignment', () => {
		const vbs = `value = 10`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('value = 10;');
	});

	it('should transpile a "Float" assignment', () => {
		const vbs = `pi = 3.14`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('pi = 3.14;');
	});

	it('should transpile "String" assignments', () => {
		const vbs = `test1 = "STRING"\ntest2 = """QUOTES"""\ntest3 = "'APOSTROPHE'"`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal("test1 = 'STRING';\ntest2 = '\"QUOTES\"';\ntest3 = '\\'APOSTROPHE\\'';");
	});

	it('should transpile "Boolean" assignments', () => {
		const vbs = `success = True\nsuccess = False`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('success = true;\nsuccess = false;');
	});

	it('should transpile "Hexadecimal" assignments', () => {
		const vbs = `test1 = &H0A\ntest2 = &H0D`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('test1 = 10;\ntest2 = 13;');
	});

	it('should transpile "Octal" assignments', () => {
		const vbs = `test1 = &O47\ntest2 = &O57`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('test1 = 39;\ntest2 = 47;');
	});

	it('should transpile a "Nothing" assignment', () => {
		const vbs = `test1 = Nothing`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('test1 = undefined;');
	});

	it('should transpile a "Null" assignments', () => {
		const vbs = `test1 = Null`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('test1 = null;');
	});

	it('should transpile an "Empty" assignments', () => {
		const vbs = `test1 = Empty`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('test1 = null;');
	});

	it('should transpile "Date" assignments', () => {
		const vbs = `test1 = #11/5/2019#\ntest2 = #11-5-2019#\ntest3 = #11-05-2019#`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			"test1 = new Date('11/5/2019');\ntest2 = new Date('11-5-2019');\ntest3 = new Date('11-05-2019');",
		);
	});

	it('should transpile "Time" assignments', () => {
		const vbs = `test1 = #1:31AM#\ntest2 = #1:31 AM#\ntest3 = #1:32:00PM#\ntest4 = #1:00#\ntest5 = #1 AM#`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			"test1 = new Date('1:31AM');\ntest2 = new Date('1:31 AM');\ntest3 = new Date('1:32:00PM');\ntest4 = new Date('1:00');\ntest5 = new Date('1 AM');",
		);
	});

	it('should transpile "Date" and "Time" assignments', () => {
		const vbs = `test1 = #11/5/2019 1:31AM#\ntest3 = #11-5-2019 1 PM#`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal("test1 = new Date('11/5/2019 1:31AM');\ntest3 = new Date('11-5-2019 1 PM');");
	});
});
