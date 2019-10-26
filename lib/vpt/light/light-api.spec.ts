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
import { Enums, LightStatus } from '../enums';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball light API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-light.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const light = table.lights.Surface.getApi();
		light.Falloff = 23; expect(light.Falloff).to.equal(23);
		light.FalloffPower = 512; expect(light.FalloffPower).to.equal(512);
		light.State = Enums.LightStatus.LightStateOn; expect(light.State).to.equal(Enums.LightStatus.LightStateOn);
		light.State = Enums.LightStatus.LightStateOff; expect(light.State).to.equal(Enums.LightStatus.LightStateOff);
		light.State = Enums.LightStatus.LightStateBlinking; expect(light.State).to.equal(Enums.LightStatus.LightStateBlinking);
		light.Color = 0x12ff54; expect(light.Color).to.equal(0x12ff54);
		light.ColorFull = 0x00de23; expect(light.ColorFull).to.equal(0x00de23);
		light.X = 12; expect(light.X).to.equal(12);
		light.Y = 1123; expect(light.Y).to.equal(1123);
		light.BlinkPattern = '1001'; expect(light.BlinkPattern).to.equal('1001');
		light.BlinkInterval = 21; expect(light.BlinkInterval).to.equal(21);
		light.Intensity = 34; expect(light.Intensity).to.equal(34);
		light.TransmissionScale = 1.2; expect(light.TransmissionScale).to.equal(1.2);
		light.IntensityScale = 3; expect(light.IntensityScale).to.equal(3);
		light.Surface = 'surface'; expect(light.Surface).to.equal('surface');
		light.Image = 'image'; expect(light.Image).to.equal('image');
		light.DepthBias = 1.5; expect(light.DepthBias).to.equal(1.5);
		light.FadeSpeedUp = 0.4; expect(light.FadeSpeedUp).to.equal(0.4);
		light.FadeSpeedDown = 0.2; expect(light.FadeSpeedDown).to.equal(0.2);
		light.Bulb = false; expect(light.Bulb).to.equal(false);
		light.Bulb = true; expect(light.Bulb).to.equal(true);
		light.ImageMode = false; expect(light.ImageMode).to.equal(false);
		light.ImageMode = true; expect(light.ImageMode).to.equal(true);
		light.ShowBulbMesh = false; expect(light.ShowBulbMesh).to.equal(false);
		light.ShowBulbMesh = true; expect(light.ShowBulbMesh).to.equal(true);
		light.StaticBulbMesh = false; expect(light.StaticBulbMesh).to.equal(false);
		light.StaticBulbMesh = true; expect(light.StaticBulbMesh).to.equal(true);
		light.ShowReflectionOnBall = false; expect(light.ShowReflectionOnBall).to.equal(false);
		light.ShowReflectionOnBall = true; expect(light.ShowReflectionOnBall).to.equal(true);
		light.ScaleBulbMesh = 40; expect(light.ScaleBulbMesh).to.equal(40);
		light.BulbModulateVsAdd = 33; expect(light.BulbModulateVsAdd).to.equal(33);
		light.BulbHaloHeight = 65; expect(light.BulbHaloHeight).to.equal(65);
		light.Visible = false; expect(light.Visible).to.equal(false);
		light.Visible = true; expect(light.Visible).to.equal(true);
	});
});
