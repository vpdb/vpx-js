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
import { Player, Table } from '..';
import { TableBuilder } from '../../test/table-builder';
import { getObject } from './objects';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('The VBScript proxy handler', () => {

	const table: Table = new TableBuilder().build();
	const player: Player = new Player(table);

	it('should execute a case-insensitive function', () => {
		const d = getObject<any>('Scripting.Dictionary', player);
		d.Add('myKey1', 'myValue1');
		d.add('myKey2', 'myValue2');
		d.ADD('myKey3', 'myValue3');

		expect(d.Item['myKey1']).to.equal('myValue1');
		expect(d.Item['myKey2']).to.equal('myValue2');
		expect(d.Item['myKey3']).to.equal('myValue3');
	});

	it('should get a case insensitive property', () => {
		const wss = getObject<any>('WScript.Shell', player);
		expect(wss.CurrentDirectory).to.equal('.');
		expect(wss.CURRENTdirectory).to.equal('.');
		expect(wss.cuRRenTdIreCtoRY).to.equal('.');
	});

	it('should set a case insensitive property', () => {
		const wss = getObject<any>('WScript.Shell', player);

		wss.CurrentDirectory = '/';
		expect(wss.CurrentDirectory).to.equal('/');

		wss.currentDIRECTORY = '/foo';
		expect(wss.CurrentDirectory).to.equal('/foo');

		wss.cuRRenTdIreCtoRY = '/bar';
		expect(wss.CurrentDirectory).to.equal('/bar');
	});

});
