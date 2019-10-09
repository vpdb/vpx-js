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
import sinonChai = require('sinon-chai');
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball dispreel API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-dispreel.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const decal = table.dispReels.EMReel001.getApi();

		decal.BackColor = 0x98e6f1;
		decal.Reels = 12;
		decal.Width = 90;
		decal.Height = 11;
		decal.X = 12.4;
		decal.Y = 500.6;
		decal.IsTransparent = true; expect(decal.IsTransparent).to.equal(true);
		decal.IsTransparent = false;
		decal.Image = 'test_pattern';
		decal.Spacing = 5.5;
		decal.Sound = 'Sound';
		decal.Steps = 7;
		decal.Range = -10; expect(decal.Range).to.equal(0);
		decal.Range = 513; expect(decal.Range).to.equal(511);
		decal.Range = 21;
		decal.UpdateInterval = 45.2;
		decal.UseImageGrid = true; expect(decal.UseImageGrid).to.equal(true);
		decal.UseImageGrid = false;
		decal.Visible = true; expect(decal.Visible).to.equal(true);
		decal.Visible = false;
		decal.ImagesPerGridRow = 17;

		expect(decal.BackColor).to.equal(0x98e6f1);
		expect(decal.Reels).to.equal(12);
		expect(decal.Width).to.equal(90);
		expect(decal.Height).to.equal(11);
		expect(decal.X).to.closeTo(12.4, 0.0001);
		expect(decal.Y).to.closeTo(500.6, 0.0001);
		expect(decal.IsTransparent).to.equal(false);
		expect(decal.Image).to.equal('test_pattern');
		expect(decal.Spacing).to.equal(5.5);
		expect(decal.Sound).to.equal('Sound');
		expect(decal.Steps).to.equal(7);
		expect(decal.Range).to.equal(21);
		expect(decal.UpdateInterval).to.equal(45.2);
		expect(decal.UseImageGrid).to.equal(false);
		expect(decal.Visible).to.equal(false);
		expect(decal.ImagesPerGridRow).to.equal(17);
	});

});
