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
import { VpmController } from './vpm-controller';

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe.only('The VpmController - VISUAL PINMAME COM OBJECT', () => {

	let vpmController: VpmController;

	beforeEach(() => {
		const table: Table = new TableBuilder().build();
		const player: Player = new Player(table);
		vpmController = new VpmController(player);
	});

	it('should set and get GameName', () => {
		const NAME: string = 'foo';
		vpmController.GameName = NAME;
		expect(vpmController.GameName).to.equal(NAME);
	});

	it('should set and get Dip[0]', () => {
		const VALUE: number = 0x55;
		vpmController.Dip[0] = VALUE;
		expect(vpmController.Dip[0]).to.equal(VALUE);
	});

	it('should set and get Dip[40]', () => {
		const VALUE: number = 0x5;
		vpmController.Dip[40] = VALUE;
		expect(vpmController.Dip[40]).to.equal(VALUE);
	});

});
