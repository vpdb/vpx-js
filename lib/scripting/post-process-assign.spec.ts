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

describe('The VBScript transpiler - Assign', () => {
	it('should transpile an assignment statement', () => {
		const vbs = `EnableBallControl = 0\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('EnableBallControl = 0;');
	});

	it('should transpile an assignment statement with function call', () => {
		const vbs = `AudioFade = Csng(-((- tmp) ^10), 20)\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('AudioFade = Csng(-Math.pow(-tmp, 10), 20);');
	});

	it('should transpile a "Set" assignment statement', () => {
		const vbs = `Set EnableBallControl = 0\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('EnableBallControl = 0;');
	});

	it('should transpile a "New" object assignment statement', () => {
		const vbs = `Set vpmDips = New cvpmDips\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('vpmDips = new cvpmDips();');
	});

	it('should transpile an assignment statement with left indexed parameters', () => {
		const vbs = `J(2,3,9,4) = X\nJ(2,3,9)(4) = X\nJ(2)(3)(9)(4) = X\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('J(2, 3, 9, 4) = X;\nJ(2, 3, 9, 4) = X;\nJ(2, 3, 9, 4) = X;');
	});

	it('should transpile an assignment statement with right indexed parameters', () => {
		const vbs = `X = J(2,3,9,4)\nX = J(2,3,9)(4)\nX = J(2)(3)(9)(4)\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('X = J(2, 3, 9, 4);\nX = J(2, 3, 9, 4);\nX = J(2, 3, 9, 4);');
	});

	it('should transpile an assignment statement with right indexed parameters', () => {
		const vbs = `J(,,,4,) = X\n`;
		const js = vbsToJs(vbs);
		expect(js).to.equal('J(null, null, null, 4, null) = X;');
	});
});
