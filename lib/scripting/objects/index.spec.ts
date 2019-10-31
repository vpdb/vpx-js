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
import { ERR } from '../stdlib/err';
import { Transpiler } from '../transpiler';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The VBScript objects implementations', () => {

	let table: Table;
	let player: Player;
	let transpiler: Transpiler;

	before(() => {
		ERR.OnErrorResumeNext();
		table = new TableBuilder().build('Table1');
		player = new Player(table);
		transpiler = new Transpiler(table, player);
	});

	after(() => {
		ERR.OnErrorGoto0();
	});

	it('should provide the "Scripting.Dictionary" object', () => {
		const scope = {} as any;
		const vbs = `Dim d\nSet d = CreateObject("Scripting.Dictionary")\nd.Add "a", "Athens"`;

		transpiler.execute(vbs, scope, 'global');
		expect(scope.d.Count).to.equal(1);
	});

	it('should provide the "VPinMAME.Controller" object', () => {
		const scope = {} as any;
		const vbs = `Dim vpm\nSet vpm = CreateObject("VPinMAME.Controller")`;

		transpiler.execute(vbs, scope, 'global');
		expect(scope.vpm).to.be.ok;
	});

	it('should provide the "Scripting.FileSystemObject" object', () => {
		const scope = {} as any;
		const vbs = `Dim fso\nSet fso = CreateObject("Scripting.FileSystemObject")`;

		transpiler.execute(vbs, scope, 'global');
		expect(scope.fso).to.be.ok;
	});

	it('should provide the "WScript.Shell" object', () => {
		const scope = {} as any;
		const vbs = `Dim wss\nSet wss = CreateObject("WScript.Shell")`;

		transpiler.execute(vbs, scope, 'global');
		expect(scope.wss).to.be.ok;
	});

	it('should fail when providing an unknown object', () => {
		const scope = {} as any;
		const vbs = `Dim x\nSet x = CreateObject("DontExist")\n`;

		transpiler.execute(vbs, scope, 'global');
		expect(ERR.Number).to.equal(429);
	});

});
