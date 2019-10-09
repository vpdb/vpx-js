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
import { createBall } from '../../../test/physics.helper';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball ball API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-empty.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const ball = createBall(player, 500, 2100, 0);
		const api = ball.getApi();

		api.X = 23;
		api.Y = 42;
		api.Z = 5.65;
		api.VelX = 198;
		api.VelY = 0.5;
		api.VelZ = 20;
		api.AngVelX = 165;
		api.AngVelY = -45;
		api.AngVelZ = 17;
		api.AngMomX = 22;
		api.AngMomY = 6.5;
		api.AngMomZ = 1.65;
		api.Color = 0x89a5f6;
		api.Image = 'Image';
		api.FrontDecal = 'test_pattern';
		api.DecalMode = true; expect(api.DecalMode).to.equal(true);
		api.DecalMode = false;
		api.Mass = 1.6;
		api.ID = 4;
		api.Radius = 12;
		api.BulbIntensityScale = 2.5;
		api.ReflectionEnabled = true; expect(api.ReflectionEnabled).to.equal(true);
		api.ReflectionEnabled = false;
		api.PlayfieldReflectionScale = 3.5;
		api.ForceReflection = true; expect(api.ForceReflection).to.equal(true);
		api.ForceReflection = false;
		api.Visible = true; expect(api.Visible).to.equal(true);
		api.Visible = false;

		expect(api.X).to.equal(23);
		expect(api.Y).to.equal(42);
		expect(api.Z).be.closeTo(5.65, 0.0001);
		expect(api.VelX).to.equal(198);
		expect(api.VelY).to.equal(0.5);
		expect(api.VelZ).to.equal(20);
		expect(api.AngVelX).to.equal(165);
		expect(api.AngVelY).to.equal(-45);
		expect(api.AngVelZ).to.equal(17);
		expect(api.AngMomX).to.equal(22);
		expect(api.AngMomY).to.equal(6.5);
		expect(api.AngMomZ).be.closeTo(1.65, 0.0001);
		expect(api.Color).to.equal(0x89a5f6);
		expect(api.Image).to.equal('Image');
		expect(api.FrontDecal).to.equal('test_pattern');
		expect(api.DecalMode).to.equal(false);
		expect(api.Mass).to.equal(1.6);
		expect(api.ID).to.equal(4);
		expect(api.Radius).to.equal(12);
		expect(api.BulbIntensityScale).to.equal(2.5);
		expect(api.ReflectionEnabled).to.equal(false);
		expect(api.PlayfieldReflectionScale).to.equal(3.5);
		expect(api.ForceReflection).to.equal(false);
		expect(api.Visible).to.equal(false);
	});

	it('should destroy the ball', () => {

		const ball = createBall(player, 500, 2100, 0);
		const api = ball.getApi();
		expect(player.balls.length).to.equal(1);

		api.DestroyBall();
		expect(player.balls.length).to.equal(0);
	});

});
