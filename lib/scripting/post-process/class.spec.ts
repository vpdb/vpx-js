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

describe('The VBScript transpiler - Class', () => {
	it('should transpile an empty class', () => {
		const vbs = `Class cvpmDictionary\nEnd Class`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('class cvpmDictionary {\n    constructor() {\n    }\n}');
	});

	it('should transpile a class with private members', () => {
		const vbs = `Class cvpmImpulseP\nPrivate mEnabled, mBalls\nEnd Class`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'class cvpmImpulseP {\n    constructor() {\n        this.mEnabled = undefined;\n        this.mBalls = undefined;\n    }\n}',
		);
	});

	it('should transpile a class with a get property', () => {
		const vbs = `Class cvpmImpulseP\nPrivate mEnabled, mBalls\nEnd Class`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'class cvpmImpulseP {\n    constructor() {\n        this.mEnabled = undefined;\n        this.mBalls = undefined;\n    }\n}',
		);
	});

	it('should transpile a class with a let property', () => {
		const vbs = `Class cvpmTimer\nPrivate mDebug\nPublic Property Let isDebug(enabled):mDebug=enabled:End Property\nEnd Class`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'class cvpmTimer {\n    constructor() {\n        this.mDebug = undefined;\n    }\n    set isDebug(enabled) {\n        this.mDebug = enabled;\n    }\n}',
		);
	});

	it('should transpile a class with method declaration', () => {
		const vbs = `Class cvpmImpulseP\nPrivate mEntrySnd\nPublic Sub InitEntrySnd(aNoBall):mEntrySnd=aNoBall:End Sub\nEnd Class`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'class cvpmImpulseP {\n    constructor() {\n        this.mEntrySnd = undefined;\n    }\n    InitEntrySnd(aNoBall) {\n        this.mEntrySnd = aNoBall;\n    }\n}',
		);
	});

	it('should transpile a class with identifiers that match member identifiers', () => {
		const vbs = `Class cvpmTimer\nPublic mBalls\nPublic Property Get Balls():Balls=mBalls.Keys:Test=x.mBalls:End Property\nEnd Class`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			'class cvpmTimer {\n    constructor() {\n        this.mBalls = undefined;\n    }\n    get Balls() {\n        let Balls = undefined;\n        Balls = this.mBalls.Keys;\n        Test = x.mBalls;\n        return Balls;\n    }\n}',
		);
	});
});
