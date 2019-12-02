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
import { ScriptHelper } from '../../../test/script.helper';
import { TableBuilder } from '../../../test/table-builder';
import { Player } from '../../game/player';
import { Table } from '../../vpt/table/table';
import { CleanupTransformer } from './cleanup-transformer';

chai.use(require('sinon-chai'));

/* tslint:disable:no-unused-expression */
describe('The scripting cleanup transformer', () => {

	let table: Table;
	let player: Player;

	beforeEach(() => {
		table = new TableBuilder().build();
		player = new Player(table);
	});

	it('should not render any comments', () => {
		const vbs = `' this is a comment\ndim test\n`;
		const js = transform(vbs);
		expect(js).to.equal(`let test;`);
	});

});

function transform(vbs: string): string {
	const scriptHelper = new ScriptHelper();
	const ast = scriptHelper.vbsToAst(vbs);
	const eventAst = new CleanupTransformer(ast).transform();
	return scriptHelper.astToVbs(eventAst);
}
