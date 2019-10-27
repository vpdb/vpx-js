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
import { Transformer } from './transformer';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting ambiguity transformer', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = new TableBuilder().addFlipper('Flipper').build();
		player = new Player(table);
	});

	describe('with an ambiguous function call', () => {

		it('should not use the helper for eval', () => {
			const vbs = `ExecuteGlobal "Dim x"\n`;
			const js = transform(vbs, table, player);
			expect(js).to.equal(`eval(${Transformer.VBSHELPER_NAME}.transpileInline('Dim x'));`);
		});

		it('should not use the helper for assignments', () => {
			const vbs = `rolling(0) = False\n`;
			const js = transform(vbs, table, player);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.rolling[0] = false;`);
		});

		it('should not use the helper for known calls', () => {
			const vbs = `x = UBound(X)\n`;
			const js = transform(vbs, table, player);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.x = ${Transformer.STDLIB_NAME}.UBound(${Transformer.SCOPE_NAME}.X);`);
		});

		it('should use the helper to access scope variables', () => {
			const vbs = `x = DOFeffects(Effect)\n`;
			const js = transform(vbs, table, player);
			expect(js).to.equal(
				`${Transformer.SCOPE_NAME}.x = ${Transformer.VBSHELPER_NAME}.getOrCall(${Transformer.SCOPE_NAME}.DOFeffects, ${Transformer.SCOPE_NAME}.Effect);`,
			);
		});
	});
});

function transform(vbs: string, table: Table, player: Player): string {
	const transpiler = new Transpiler(table, player);
	return transpiler.transpile(vbs);
}
