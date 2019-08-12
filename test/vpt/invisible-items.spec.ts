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

import { ThreeHelper } from '../three.helper';
import { expect } from 'chai';
import { NodeBinaryReader } from '../../lib/io/binary-reader.node';
import { Table } from '../../lib/vpt/table/table';
import { Player } from '../../lib/game/player';

const three = new ThreeHelper();

describe('The VPinball parser for invisible elements', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-invisible.vpx')), { loadInvisibleItems: true });
		player = new Player(table).init();
	});

	it('should parse a text box item', async () => {
		const textBox= table.textBoxes.TextBox1;
		expect(textBox).to.be.an('object');
		expect(textBox.backColor).to.equal(0xff0000);
		expect(textBox.fontColor).to.equal(0x0000ff);
		expect(textBox.v1.x).to.equal(253);
		expect(textBox.v1.y).to.equal(348);
		expect(textBox.v2.x).to.equal(253 + 100);
		expect(textBox.v2.y).to.equal(348 + 50);
	});
});
