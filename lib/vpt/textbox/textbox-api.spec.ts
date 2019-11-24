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
import * as sinonChai from 'sinon-chai';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Enums } from '../enums';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball textbox API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-textbox.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read the properties', async () => {
		const textbox = table.textboxes.TextBox1.getApi();

		expect(textbox.BackColor).to.equal(0xff0000);
		expect(textbox.FontColor).to.equal(0x0000ff);
		expect(textbox.Text).to.equal('VPDB');
		expect(textbox.X).to.equal(253);
		expect(textbox.Y).to.equal(348);
		expect(textbox.Width).to.equal(100);
		expect(textbox.Height).to.equal(50);
		expect(textbox.Alignment).to.equal(Enums.TextAlignment.TextAlignCenter);
		expect(textbox.IsTransparent).to.equal(false);
	});

	it('should correctly modify the properties', async () => {
		const textbox = table.textboxes.TextBox1.getApi();

		textbox.BackColor = 0x95f1cd;
		textbox.FontColor = 0x6f5b46;
		textbox.Text = 'Some Text';
		textbox.X = 12;
		textbox.Y = 13;
		textbox.Width = 14;
		textbox.Height = 15;
		textbox.IntensityScale = 33.2;
		textbox.Alignment = Enums.TextAlignment.TextAlignLeft;
		textbox.IsTransparent = true; expect(textbox.IsTransparent).to.equal(true);
		textbox.IsTransparent = false;
		textbox.DMD = true; expect(textbox.DMD).to.equal(true);
		textbox.DMD = false;
		textbox.Visible = true; expect(textbox.Visible).to.equal(true);
		textbox.Visible = false;

		expect(textbox.BackColor).to.equal(0x95f1cd);
		expect(textbox.FontColor).to.equal(0x6f5b46);
		expect(textbox.Text).to.equal('Some Text');
		expect(textbox.X).to.equal(12);
		expect(textbox.Y).to.equal(13);
		expect(textbox.Width).to.equal(14);
		expect(textbox.Height).to.equal(15);
		expect(textbox.IntensityScale).to.equal(33.2);
		expect(textbox.Alignment).to.equal(Enums.TextAlignment.TextAlignLeft);
		expect(textbox.IsTransparent).to.equal(false);
		expect(textbox.DMD).to.equal(false);
		expect(textbox.Visible).to.equal(false);
	});

	it('should not crash when executing unused APIs', () => {
		const textbox = table.textboxes.TextBox1.getApi();
		expect(textbox.InterfaceSupportsErrorInfo({})).to.equal(false);
	});

});
