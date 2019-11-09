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
import { OffsetIndex } from './offset-index';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('The Offset Index calculator', () => {

	it('0 -> 11', () => {
		const result: OffsetIndex = OffsetIndex.fromZeroBased(0);
		expect(result.wpcMatrixIndex).to.equal(11);
		expect(result.zeroBasedIndex).to.equal(0);
	});

	it('7 -> 18', () => {
		const result: number = OffsetIndex.fromZeroBased(7).wpcMatrixIndex;
		expect(result).to.equal(18);
	});

	it('8 -> 21', () => {
		const result: number = OffsetIndex.fromZeroBased(8).wpcMatrixIndex;
		expect(result).to.equal(21);
	});

	it('63 -> 88', () => {
		const result: number = OffsetIndex.fromZeroBased(63).wpcMatrixIndex;
		expect(result).to.equal(88);
	});

	it('11 -> 0', () => {
		const result: OffsetIndex = OffsetIndex.fromWpcMatrix(11);
		expect(result.wpcMatrixIndex).to.equal(11);
		expect(result.zeroBasedIndex).to.equal(0);
	});

	it('21 -> 8', () => {
		const result: OffsetIndex = OffsetIndex.fromWpcMatrix(21);
		expect(result.wpcMatrixIndex).to.equal(21);
		expect(result.zeroBasedIndex).to.equal(8);
	});

	it('should detect invalid index', () => {
		expect(() => OffsetIndex.fromWpcMatrix(0)).to.throw(/NEGATIVE_INDEX_DETECTED/);
	});

});
