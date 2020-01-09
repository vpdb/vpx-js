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

describe('The VBScript transpiler - Assign', () => {
	it('should transpile an assignment statement', () => {
		const vbs = `EnableBallControl = 0`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('EnableBallControl = 0;');
	});

	it('should transpile an assignment statement with function call', () => {
		const vbs = `AudioFade = Csng(-((- tmp) ^10), 20)`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('AudioFade = Csng(-__vbs.exponent(-tmp, 10), 20);');
	});

	it('should transpile a "Set" assignment statement', () => {
		const vbs = `Set EnableBallControl = 0`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('EnableBallControl = 0;');
	});

	it('should transpile a "New" object assignment statement', () => {
		const vbs = `Set vpmDips = New cvpmDips`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('vpmDips = new cvpmDips();');
	});

	it('should transpile a "New/Nothing" object assignment statement', () => {
		const vbs = `Set vpmDips = New cvpmDips Nothing`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('vpmDips = new cvpmDips();\nvpmDips = Nothing;');
	});

	it('should transpile an assignment statement with left parameters', () => {
		const vbs = `J(2,3,9,4) = X`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('J(2, 3, 9, 4) = X;');
	});

	it('should transpile an assignment statement with missing left parameters', () => {
		const vbs = `J(,1,,,4,)=X`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('J(undefined, 1, undefined, undefined, 4, undefined) = X;');
	});

	it('should transpile an assignment statement with right parameters', () => {
		const vbs = `X = J(2,3,9,4)`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('X = J(2, 3, 9, 4);');
	});

	it('should transpile an assignment statement with missing right parameters', () => {
		const vbs = `X = J(,2,,9,,4,)`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('X = J(undefined, 2, undefined, 9, undefined, 4, undefined);');
	});
});
