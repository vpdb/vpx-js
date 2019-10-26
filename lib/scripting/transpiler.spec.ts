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
import { Table } from '../vpt/table/table';
import { Transpiler } from './transpiler';

import * as sinon from 'sinon';
import { TableBuilder } from '../../test/table-builder';
import { Player } from '../game/player';
import { Transformer } from './transformer/transformer';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The VBScript transpiler', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = new TableBuilder().addFlipper('Flipper').build();
		player = new Player(table);
	});

	it('should wrap everything into a global function', () => {
		const vbs = `Dim test\n`;
		const transpiler = new Transpiler(table, player);
		const js = transpiler.transpile(vbs, 'runTableScript');
		expect(js).to.equal(`runTableScript = (${Transformer.SCOPE_NAME}, ${Transformer.ITEMS_NAME}, ${Transformer.ENUMS_NAME}, ${Transformer.GLOBAL_NAME}, ${Transformer.STDLIB_NAME}, ${Transformer.VBSHELPER_NAME}) => {\n        __scope.test = null;\n};`);
	});

	it('should wrap everything into a function of an object', () => {
		const vbs = `Dim test\n`;
		const transpiler = new Transpiler(table, player);
		const js = transpiler.transpile(vbs, 'runTableScript', 'window');
		expect(js).to.equal(`window.runTableScript = (${Transformer.SCOPE_NAME}, ${Transformer.ITEMS_NAME}, ${Transformer.ENUMS_NAME}, ${Transformer.GLOBAL_NAME}, ${Transformer.STDLIB_NAME}, ${Transformer.VBSHELPER_NAME}) => {\n        __scope.test = null;\n};`);
	});

	it('should execute the table script', () => {
		const Spy = sinon.spy();
		const vbs = `Spy\n`;                                 // that's our spy, in VBScript!
		const transpiler = new Transpiler(table, player);
		transpiler.execute(vbs, 'global', { Spy });       // this should execute the spy

		expect(Spy).to.have.been.calledOnce;
	});

	it('should handle case insensitivity when reading global variables', () => {
		const scope = {} as any;
		const vbs = `MyVariable = 10\nValueRead = mYvArIAblE`;
		const transpiler = new Transpiler(table, player);
		transpiler.execute(vbs, 'global', scope);

		expect(scope.ValueRead).to.equal(10);
	});

	it('should handle case insensitivity when writing global variables', () => {
		const scope = {} as any;
		const vbs = `MyVariable = 10\nmYvArIAblE = 12`;
		const transpiler = new Transpiler(table, player);
		transpiler.execute(vbs, 'global', scope);

		expect(scope.MyVariable).to.equal(12);
	});

	it('should handle case insensitivity when calling functions', () => {
		const scope = {} as any;
		const vbs = `Sub Abc\nMyVariable = 13\nEnd Sub\naBC`;
		const transpiler = new Transpiler(table, player);
		transpiler.execute(vbs, 'global', scope);

		expect(scope.MyVariable).to.equal(13);
	});

});
