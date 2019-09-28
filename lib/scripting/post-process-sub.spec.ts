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

describe('The VBScript transpiler - Sub', () => {
	it('should transpile a sub declaration with empty params', () => {
		const vbs = `Sub BallRelease_Hit()\nBallRelease.CreateBall\nEnd Sub\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile an inline sub declaration with empty params', () => {
		const vbs = `Sub BallRelease_Hit() BallRelease.CreateBall End Sub\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a sub declaration with params', () => {
		const vbs = `Sub BallRelease_Hit(value1, value2, value3)\nBallRelease.CreateBall\nEnd Sub\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit(value1, value2, value3) {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile an inline sub declaration with params', () => {
		const vbs = `Sub BallRelease_Hit(value1, value2, value3) BallRelease.CreateBall End Sub\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit(value1, value2, value3) {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a sub declaration with no params', () => {
		const vbs = `Sub BallRelease_Hit\nBallRelease.CreateBall\nEnd Sub\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile an inline sub declaration with no params', () => {
		const vbs = `Sub BallRelease_Hit BallRelease.CreateBall End Sub\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a "Private" sub declaration with empty params', () => {
		const vbs = `Private Sub BallRelease_Hit()\nBallRelease.CreateBall\nEnd Sub\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a "Public" sub declaration with empty params', () => {
		const vbs = `Public Sub BallRelease_Hit()\nBallRelease.CreateBall\nEnd Sub\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});

	it('should transpile a "Public Default" sub declaration with empty params', () => {
		const vbs = `Public Default Sub BallRelease_Hit()\nBallRelease.CreateBall\nEnd Sub\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('function BallRelease_Hit() {\n    BallRelease.CreateBall();\n}');
	});
});
