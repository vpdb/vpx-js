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
import { VBSHelper } from './vbs-helper';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting VBS Helper', () => {
	const vbsHelper = new VBSHelper();

	it('should create a three dimension array using dim', () => {
		const js = vbsHelper.dim([4, 3, 2]);
		expect(js.length).to.equal(5);
		expect(js[0].length).to.equal(4);
		expect(js[0][0].length).to.equal(3);
	});

	it('should test upper bounds of a three dimension array using dim', () => {
		expect(() => {
			const js = vbsHelper.dim([4, 3, 2]);
			js[4][4][2] = 'Test';
		}).to.throw(`Cannot set property '2' of undefined`);
	});

	it('should set a value in a three dimension array', () => {
		const js = vbsHelper.dim([4, 3, 2]);
		js[2][2][1] = 'Test';
		expect(js[2][2][1]).to.equal('Test');
	});
});
