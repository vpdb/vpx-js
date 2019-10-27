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
	let transpiler: Transpiler;

	before(async () => {
		table = new TableBuilder().addFlipper('Flipper').build();
		player = new Player(table);
		transpiler = new Transpiler(table, player);
	});

	describe('with an ambiguous function call', () => {

		it('should not use the helper for eval', () => {
			const vbs = `ExecuteGlobal "Dim x"\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`eval(${Transformer.VBSHELPER_NAME}.transpileInline('Dim x'));`);
		});

		it('should not use the helper for assignments', () => {
			const vbs = `rolling(0) = False\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.rolling[0] = false;`);
		});

		it('should not use the helper for known calls', () => {
			const vbs = `x = UBound(X)\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.x = ${Transformer.STDLIB_NAME}.UBound(${Transformer.SCOPE_NAME}.X);`);
		});

		it('should not use the helper string parameters', () => {
			const vbs = `LoadController "EM"\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.LoadController('EM');`);
		});

		it('should use the helper to access scope variables', () => {
			const vbs = `x = DOFeffects(Effect)\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(
				`${Transformer.SCOPE_NAME}.x = ${Transformer.VBSHELPER_NAME}.getOrCall(${Transformer.SCOPE_NAME}.DOFeffects, ${Transformer.SCOPE_NAME}.Effect);`,
			);
		});
	});

	describe('with an ambiguous property', () => {

		it('should convert to a function for known global members', () => {
			const vbs = `BOT = GetBalls\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.BOT = ${Transformer.GLOBAL_NAME}.GetBalls();`);
		});

		it('should convert to a function for known item members', () => {
			const vbs = `BOT = Flipper.RotateToEnd\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.BOT = ${Transformer.ITEMS_NAME}.Flipper.RotateToEnd();`);
		});

		it('should not use the helper for known members', () => {
			const vbs = `BOT = Name\n`;
			const js = transpiler.transpile(vbs);
			expect(js).to.equal(`${Transformer.SCOPE_NAME}.BOT = ${Transformer.GLOBAL_NAME}.Name;`);
		});

	});

});
