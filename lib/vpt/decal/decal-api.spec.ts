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
import { DecalType, ImageAlignment, SizingType } from '../enums';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball decal API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-decal.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const decal = table.decals.Decal001.getApi();

		decal.Rotation = 128;
		decal.Image = 'test_pattern';
		decal.Width = 1685;
		decal.Height = 115;
		decal.X = 304;
		decal.Y = 1.8;
		decal.Surface = 'surface';
		decal.Type = DecalType.DecalImage; expect(decal.Type).to.equal(DecalType.DecalImage);
		decal.Type = DecalType.DecalText;
		decal.Text = 'Text';
		decal.SizingType = SizingType.AutoSize; expect(decal.SizingType).to.equal(SizingType.AutoSize);
		decal.SizingType = SizingType.AutoWidth;
		decal.FontColor = 0x913a8d;
		decal.Material = 'Material';
		decal.Font = 'Font';
		decal.HasVerticalText = true; expect(decal.HasVerticalText).to.equal(true);
		decal.HasVerticalText = false;

		expect(decal.Rotation).to.equal(128);
		expect(decal.Image).to.equal('test_pattern');
		expect(decal.Width).to.equal(1685);
		expect(decal.Height).to.equal(115);
		expect(decal.X).to.equal(304);
		expect(decal.Y).to.be.closeTo(1.8, 0.0001);
		expect(decal.Surface).to.equal('surface');
		expect(decal.Type).to.equal(DecalType.DecalText);
		expect(decal.Text).to.equal('Text');
		expect(decal.SizingType).to.equal(SizingType.AutoWidth);
		expect(decal.FontColor).to.equal(0x913a8d);
		expect(decal.Material).to.equal('Material');
		expect(decal.Font).to.equal('Font');
		expect(decal.HasVerticalText).to.equal(false);
	});

});
