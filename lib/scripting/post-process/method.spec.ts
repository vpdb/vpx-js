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

describe('The VBScript transpiler - Method - Sub', () => {
	it('should transpile a sub declaration with empty params', () => {
		const vbs = `Sub BallRelease_Hit()\nBallRelease.CreateBall\nEnd Sub`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile an inline sub declaration with empty params', () => {
		const vbs = `Sub BallRelease_Hit() BallRelease.CreateBall End Sub`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a sub declaration with params', () => {
		const vbs = `Sub BallRelease_Hit(value1, value2, value3)\nBallRelease.CreateBall\nEnd Sub`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit(value1, value2, value3) {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile an inline sub declaration with params', () => {
		const vbs = `Sub BallRelease_Hit(value1, value2, value3) BallRelease.CreateBall End Sub`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit(value1, value2, value3) {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a sub declaration with no params', () => {
		const vbs = `Sub BallRelease_Hit\nBallRelease.CreateBall\nEnd Sub`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile an inline sub declaration with no params', () => {
		const vbs = `Sub BallRelease_Hit BallRelease.CreateBall End Sub`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});
});

describe('The VBScript transpiler - Method - Function', () => {
	it('should transpile a function with empty params', () => {
		const vbs = `Function BallRelease_Hit()\nBallRelease_Hit = BallRelease.CreateBall\nEnd Function`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'function BallRelease_Hit() {\n    let BallRelease_Hit = undefined;\n    BallRelease_Hit = BallRelease.CreateBall;\n    return BallRelease_Hit;\n}',
		);
	});

	it('should transpile an inline function with empty params', () => {
		const vbs = `Function BallRelease_Hit() BallRelease_Hit = BallRelease.CreateBall End Function`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'function BallRelease_Hit() {\n    let BallRelease_Hit = undefined;\n    BallRelease_Hit = BallRelease.CreateBall;\n    return BallRelease_Hit;\n}',
		);
	});

	it('should transpile a function with params', () => {
		const vbs = `Function BallRelease_Hit(value1, value2, value3)\nBallRelease.CreateBall\nEnd Function`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'function BallRelease_Hit(value1, value2, value3) {\n    let BallRelease_Hit = undefined;\n    BallRelease.CreateBall();\n    return BallRelease_Hit;\n}',
		);
	});

	it('should transpile an inline function with params', () => {
		const vbs = `Function BallRelease_Hit(value1, value2, value3) BallRelease.CreateBall End Function`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'function BallRelease_Hit(value1, value2, value3) {\n    let BallRelease_Hit = undefined;\n    BallRelease.CreateBall();\n    return BallRelease_Hit;\n}',
		);
	});

	it('should transpile a function with params and exit', () => {
		const vbs = `Function MyFunction(value)\nMyFunction = 6\nif value = 5 Then\nMyFunction = 10\nExit Function\nEnd If\nEnd Function`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'function MyFunction(value) {\n    let MyFunction = undefined;\n    MyFunction = 6;\n    if (value == 5) {\n        MyFunction = 10;\n        return MyFunction;\n    }\n    return MyFunction;\n}',
		);
	});

	it('should transpile a inline function with params and exit', () => {
		const vbs = `Function MyFunction(value) Exit Function End Function`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('function MyFunction(value) {\n    let MyFunction = undefined;\n    return MyFunction;\n}');
	});

	it('should transpile a function with no params', () => {
		const vbs = `Function BallRelease_Hit\nBallRelease_Hit = BallRelease.CreateBall\nEnd Function`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'function BallRelease_Hit() {\n    let BallRelease_Hit = undefined;\n    BallRelease_Hit = BallRelease.CreateBall;\n    return BallRelease_Hit;\n}',
		);
	});

	it('should transpile an inline function with no params', () => {
		const vbs = `Function BallRelease_Hit BallRelease_Hit = BallRelease.CreateBall End Function`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'function BallRelease_Hit() {\n    let BallRelease_Hit = undefined;\n    BallRelease_Hit = BallRelease.CreateBall;\n    return BallRelease_Hit;\n}',
		);
	});
});
