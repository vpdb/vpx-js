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
import { TableBuilder } from '../../../test/table-builder';
import { Player } from '../../game/player';
import { Table } from '../../vpt/table/table';
import { Transpiler } from '../transpiler';
import { Err } from './err';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The VBScript error object', () => {

	it('should persist all properties when raising', () => {

		const err = new Err();
		err.OnErrorResumeNext();
		err.Raise(1, 'source', 'descr', 'helpfile', 'helpcontext');

		expect(err.Number).to.equal(1);
		expect(err.Source).to.equal('source');
		expect(err.Description).to.equal('descr');
		expect(err.HelpFile).to.equal('helpfile');
		expect(err.HelpContext).to.equal('helpcontext');
	});

	it('should clear all properties when clearing', () => {

		const err = new Err();
		err.OnErrorResumeNext();
		err.Raise(1, 'source', 'descr', 'helpfile', 'helpcontext');
		err.Clear();

		expect(err.Number).to.equal(0);
		expect(err.Source).to.equal('');
		expect(err.Description).to.equal('');
		expect(err.HelpFile).to.equal('');
		expect(err.HelpContext).to.equal('');
	});

	it('should throw an exception', () => {
		const err = new Err();
		expect(() => err.Raise(1, undefined, 'duh')).to.throw(`Error 1: duh`);
	});

});
