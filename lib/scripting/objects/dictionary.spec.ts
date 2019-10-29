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
import { ERR } from '../stdlib/error-handler';
import { Dictionary } from './dictionary';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('The VBScript dictionary', () => {

	it('should read and write values', () => {
		const d = new Dictionary();
		d.Add('myKey', 'myValue');

		expect(d.Item['myKey']).to.equal('myValue');
	});

	it('should read and write values via property', () => {
		const d = new Dictionary();
		d.Item['myKey'] = 'myValue';
		expect(d.Item['myKey']).to.equal('myValue');
		expect(d.Count).to.equal(1);
	});

	it('should check if a value exists', () => {
		const d = new Dictionary();
		d.Add('myKey2', 'myValue');

		expect(d.Exists('myKey')).to.equal(false);
		expect(d.Exists('myKey2')).to.equal(true);
	});

	it('should count the items', () => {
		const d = new Dictionary();
		d.Add('a', 'Athens');
		d.Add('b', 'Belgrade');
		d.Add('c', 'Cairo');

		expect(d.Count).to.equal(3);
	});

	it('should remove one item', () => {
		const d = new Dictionary();
		d.Add('a', 'Athens');
		d.Add('b', 'Belgrade');
		d.Add('c', 'Cairo');

		d.Remove('b');
		expect(d.Count).to.equal(2);
	});

	it('should remove all items', () => {
		const d = new Dictionary();
		d.Add('a', 'Athens');
		d.Add('b', 'Belgrade');
		d.Add('c', 'Cairo');

		d.RemoveAll();
		expect(d.Count).to.equal(0);
	});

	it('should count change a key', () => {
		const d = new Dictionary();
		d.Add('a', 'Athens');
		d.Add('b', 'Belgrade');
		d.Add('c', 'Cairo');

		d.Key['a'] = 'aa';
		expect(d.Item['aa']).to.equal('Athens');
	});

	it('should retrieve all keys', () => {
		const d = new Dictionary();
		d.Add('a', 'Athens');
		d.Add('b', 'Belgrade');
		d.Add('c', 'Cairo');

		expect(d.Keys()).to.eql(['a', 'b', 'c']);
	});

	it('should retrieve all items', () => {
		const d = new Dictionary();
		d.Add('a', 'Athens');
		d.Add('b', 'Belgrade');
		d.Add('c', 'Cairo');

		expect(d.Items()).to.eql(['Athens', 'Belgrade', 'Cairo']);
	});

	it('should create an empty value', () => {
		const d = new Dictionary();
		const n = d.Item['new'];

		expect(n).to.be.null;
		expect(d.Item['new']).to.be.null;
	});

	it('should fail adding an existing item', () => {
		const d = new Dictionary();
		d.Add('a', 'Athens');
		d.Add('b', 'Belgrade');
		d.Add('b', 'Cairo');

		expect(ERR.getError()).to.be.ok;
	});

	it('should fail changing a non-existing key', () => {
		const d = new Dictionary();
		d.Add('a', 'Athens');
		d.Add('b', 'Belgrade');

		d.Key['bb'] = 'bbb';
		expect(ERR.getError()).to.be.ok;
	});

	it('should fail removing a non-existing item', () => {
		const d = new Dictionary();
		d.Add('a', 'Athens');
		d.Add('b', 'Belgrade');
		d.Add('c', 'Cairo');

		d.Remove('nonexistent');
		expect(ERR.getError()).to.be.ok;
	});

});
