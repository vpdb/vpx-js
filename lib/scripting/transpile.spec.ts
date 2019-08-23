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
	it('should transpile a single variable declaration', () => {
		const vbs = `Dim test1\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('let test1;\n');
	});

	it('should transpile a multiple variable declaration', () => {
		const vbs = `Dim test1, test2, test3\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('let test1, test2, test3;\n');
	});

	it('should transpile a single Const declaration', () => {
		const vbs = `Const pi = 3.14\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('const pi = 3.14;\n');
	});

	it('should transpile a multiple Const declaration', () => {
		const vbs = `Const test1 = 3.14, test2 = 4, test3 = "TEST", test4 = -5.2\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('const test1 = 3.14, test2 = 4, test3 = "TEST", test4 = -5.2;\n');
	});

	it('should transpile a subcall statement without params', () => {
		const vbs = `BallRelease.CreateBall\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease.CreateBall();\n');
	});

	it('should transpile a subcall statement with params', () => {
		const vbs = `BallRelease.KickBall 0, -2\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('BallRelease.KickBall(0, -2);\n');
	});
});
