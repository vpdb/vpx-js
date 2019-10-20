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
import { ImageAlignment } from '../enums';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball flasher API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-flasher.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const flasher = table.flashers.Flasher.getApi();

		flasher.X = 304;
		flasher.Y = 1.8;
		flasher.RotX = 554.7;
		flasher.RotY = 943;
		flasher.RotZ = 275;
		flasher.Height = 52;
		flasher.Color = 0x55ff9a;
		flasher.ImageA = 'ImageA';
		flasher.ImageB = 'ImageB';
		flasher.Filter = 'Additive'; expect(flasher.Filter).to.equal('Additive');
		flasher.Filter = 'Multiply'; expect(flasher.Filter).to.equal('Multiply');
		flasher.Filter = 'Screen'; expect(flasher.Filter).to.equal('Screen');
		flasher.Filter = 'None'; expect(flasher.Filter).to.equal('None');
		flasher.Filter = 'invalid-so-none';
		flasher.Opacity = -5; expect(flasher.Opacity).to.equal(0);
		flasher.Opacity = 0.9;
		flasher.IntensityScale = 1.5;
		flasher.ModulateVsAdd = 0.8;
		flasher.Amount = -1; expect(flasher.Amount).to.equal(0);
		flasher.Amount = 5;
		flasher.Visible = true; expect(flasher.Visible).to.equal(true);
		flasher.Visible = false;
		flasher.DisplayTexture = true; expect(flasher.DisplayTexture).to.equal(true);
		flasher.DisplayTexture = false;
		flasher.AddBlend = true; expect(flasher.AddBlend).to.equal(true);
		flasher.AddBlend = false;
		flasher.DMD = true; expect(flasher.DMD).to.equal(true);
		flasher.DMD = false;
		flasher.DepthBias = 2.6;
		flasher.ImageAlignment = ImageAlignment.ImageAlignTopLeft; expect(flasher.ImageAlignment).to.equal(ImageAlignment.ImageAlignTopLeft);
		flasher.ImageAlignment = ImageAlignment.ImageAlignWorld;

		expect(flasher.X).to.equal(304);
		expect(flasher.Y).to.be.closeTo(1.8, 0.0001);
		expect(flasher.RotX).to.equal(554.7);
		expect(flasher.RotY).to.equal(943);
		expect(flasher.RotZ).to.equal(275);
		expect(flasher.Height).to.equal(52);
		expect(flasher.Color).to.equal(0x55ff9a);
		expect(flasher.RotY).to.equal(943);
		expect(flasher.ImageA).to.equal('ImageA');
		expect(flasher.ImageB).to.equal('ImageB');
		expect(flasher.Filter).to.equal('None');
		expect(flasher.Opacity).to.equal(0.9);
		expect(flasher.IntensityScale).to.equal(1.5);
		expect(flasher.ModulateVsAdd).to.equal(0.8);
		expect(flasher.Amount).to.equal(5);
		expect(flasher.Visible).to.equal(false);
		expect(flasher.DisplayTexture).to.equal(false);
		expect(flasher.AddBlend).to.equal(false);
		expect(flasher.DMD).to.equal(false);
		expect(flasher.DepthBias).to.equal(2.6);
		expect(flasher.ImageAlignment).to.equal(ImageAlignment.ImageAlignWorld);
	});

	it('should not crash when executing unused APIs', () => {
		const flasher = table.flashers.Flasher.getApi();
		expect(flasher.InterfaceSupportsErrorInfo({})).to.equal(false);
	});

});
