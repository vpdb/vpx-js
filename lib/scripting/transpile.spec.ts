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
import { vbsToJs } from './transpile';

describe('The VBScript transpiler', () => {
	it('should transpile an Option Explicit', () => {
		const vbs = `Option Explicit\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal(';    /* Option Explicit */');
	});

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

	it('should transpile a single Const declaration', () => {
		const vbs = `Const pi = 3.14\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('const pi = 3.14;');
	});

	it('should transpile a multiple Const declaration', () => {
		const vbs = `Const test1 = 3.14, test2 = 4, test3 = "TEST", test4 = -5.2\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('const test1 = 3.14, test2 = 4, test3 = \'TEST\', test4 = -5.2;');
	});

	it('should transpile a subcall statement without params', () => {
		const vbs = `BallRelease.CreateBall\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease.CreateBall();');
	});

	it('should transpile a subcall statement with params', () => {
		const vbs = `BallRelease.KickBall 0, -2\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease.KickBall(0, -2);');
	});

	it('should transpile a sub declaration without params', () => {
		const vbs = `Sub BallRelease_Hit()\n    BallRelease.CreateBall\nEnd Sub\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a sub declaration with params', () => {
		const vbs = `Sub BallRelease_Hit(value1, value2, value3)\n    BallRelease.CreateBall\nEnd Sub\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit(value1, value2, value3) {\n    BallRelease.CreateBall();\n}');
	});

	it ('should transpile an assignment statement', () => {
		const vbs = `EnableBallControl = 0\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('EnableBallControl = 0;');
	});

	it ('should transpile an add expression +', () => {
		const vbs = `EnableBallControl = EnableBallControl + 1\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('EnableBallControl = EnableBallControl + 1;');
	});

	it ('should transpile an add expression -', () => {
		const vbs = `EnableBallControl = EnableBallControl - 1\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('EnableBallControl = EnableBallControl - 1;');
	});
});
