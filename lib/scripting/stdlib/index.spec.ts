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
import { f4 } from '../../math/float';
import { Table } from '../../vpt/table/table';
import { Transpiler } from '../transpiler';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The VBScript stdlib', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = new TableBuilder().addFlipper('Flipper').build();
		player = new Player(table);
	});

	it('should provide the Csng function', () => {
		const scope = {} as any;
		const vbs = `result = csng(1.3)`;
		const transpiler = new Transpiler(table, player);
		transpiler.execute(vbs, scope, 'global');

		expect(scope.result).to.equal(f4(1.3));
	});

	it('should provide the Int function', () => {
		const scope = {} as any;
		const vbs = `result = Int(1.3)`;
		const transpiler = new Transpiler(table, player);
		transpiler.execute(vbs, scope, 'global');

		expect(scope.result).to.equal(1);
	});

	it('should provide the Sqr function', () => {
		const scope = {} as any;
		const vbs = `result = sqr(9)`;
		const transpiler = new Transpiler(table, player);
		transpiler.execute(vbs, scope, 'global');

		expect(scope.result).to.equal(3);
	});

	it('should provide the UBound function', () => {
		const scope = {} as any;
		const vbs = `dim arr(9)\nresult = UBound(arr)`;
		const transpiler = new Transpiler(table, player);
		transpiler.execute(vbs, scope, 'global');

		expect(scope.result).to.equal(9);
	});

	it('should provide the Randomize function', () => {
		const scope = {} as any;
		const vbs = `Randomize`;
		const transpiler = new Transpiler(table, player);
		transpiler.execute(vbs, scope, 'global');
	});

	it('should provide the Math object', () => {
		const scope = {} as any;
		const vbs = `result = math`;
		const transpiler = new Transpiler(table, player);
		transpiler.execute(vbs, scope, 'global');

		expect(scope.result).to.be.ok;
	});

	it('should provide the Err object', () => {
		const scope = {} as any;
		const vbs = `result = Err`;
		const transpiler = new Transpiler(table, player);
		transpiler.execute(vbs, scope, 'global');

		expect(scope.result).to.be.ok;
	});

});
