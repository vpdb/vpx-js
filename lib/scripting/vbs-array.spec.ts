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

import * as chai from 'chai';
import { expect } from 'chai';
import { ERR } from './stdlib/err';
import { VbsArray } from './vbs-array';
import { VbsUndefined } from './vbs-undefined';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('The VBScript array', () => {

	before(() => {
		ERR.OnErrorResumeNext();
	});

	after(() => {
		ERR.OnErrorGoto0();
	});

	it('should initialize correctly', () => {
		const arr = new VbsArray<number | string>([1, 'two', 3]);
		expect(arr[0]).to.equal(1);
		expect(arr[1]).to.equal('two');
		expect(arr[2]).to.equal(3);
	});

	it('should loop correctly', () => {
		const arr = new VbsArray<number | string>() as any;
		arr[0] = 1;
		arr[1] = 'two';
		arr[2] = 3;
		let i = 0;
		for (const val of arr) {
			switch (i) {
				case 0: expect(val).to.equal(1); break;
				case 1: expect(val).to.equal('two'); break;
				case 2: expect(val).to.equal(3); break;
				default: throw new Error('Out of range!');
			}
			i++;
		}
	});

	it('should count correctly', () => {
		const arr = new VbsArray<number | string>([1, 'two', 3]) as any;
		expect(arr.length).to.equal(3);
	});

	it('should return a fake object for unknown indices', () => {
		const arr = new VbsArray<number | string>([1, 'two', 3]);
		const none = arr[99] as any;
		expect(none).to.be.an.instanceof(VbsUndefined);
	});

	it('should register an error when getting a value from an undefined array value', () => {
		const arr = new VbsArray<number | string>([1, 'two', 3]);
		const none = arr[99] as any;
		expect(() => none.foo).not.to.throw();
		expect(() => none.foo.bar).not.to.throw();
		expect(ERR.Number).to.equal(9);
	});

	it('should register an error when setting a value from an undefined array value', () => {
		const arr = new VbsArray<number | string>([1, 'two', 3]);
		const none = arr[99] as any;
		expect(() => none.foo = 10).not.to.throw();
		expect(() => none.foo.bar = 10).not.to.throw();
		expect(ERR.Number).to.equal(9);
	});
});
