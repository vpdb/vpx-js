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
import { astToVbs, vbsToAst } from '../../../test/script.helper';
import { TableBuilder } from '../../../test/table-builder';
import { Player } from '../../game/player';
import { Table } from '../../vpt/table/table';
import { FunctionHoistTransformer } from './function-hoist-transformer';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting function hoist transformer', () => {

	let table: Table;
	let player: Player;

	beforeEach(() => {
		table = new TableBuilder().build();
		player = new Player(table);
	});

	it('should move a function to the top', () => {
		const vbs = `test\nsub test\nend sub`;
		const js = transform(vbs);
		expect(js).to.equal(`function test() {\n}\ntest();`);
	});

});

function transform(vbs: string): string {
	const ast = vbsToAst(vbs);
	const eventAst = new FunctionHoistTransformer(ast).transform();
	return astToVbs(eventAst);
}
