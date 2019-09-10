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

describe('The VBScript transpiler - Function', () => {
	it('should transpile a function with empty params', () => {
		const vbs = `Function BallRelease_Hit()\nBallRelease.CreateBall\nEnd Function\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a function with params', () => {
		const vbs = `Function BallRelease_Hit(value1, value2, value3)\nBallRelease.CreateBall\nEnd Function\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit(value1, value2, value3) {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a function with no params', () => {
		const vbs = `Function BallRelease_Hit\nBallRelease.CreateBall\nEnd Function\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a "Private" function with empty params', () => {
		const vbs = `Private Function BallRelease_Hit()\nBallRelease.CreateBall\nEnd Function\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a "Public" function with empty params', () => {
		const vbs = `Public Function BallRelease_Hit()\nBallRelease.CreateBall\nEnd Function\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a "Public Default" function without params', () => {
		const vbs = `Public Default Function BallRelease_Hit()\nBallRelease.CreateBall\nEnd Function\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});
});
