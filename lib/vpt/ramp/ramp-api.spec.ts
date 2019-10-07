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

describe('The VPinball ramp API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-ramp.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const ramp = table.ramps.Flat.getApi();

		ramp.HeightBottom = 23; expect(ramp.HeightBottom).to.equal(23);
		ramp.HeightTop = 523; expect(ramp.HeightTop).to.equal(523);
		ramp.WidthBottom = 226; expect(ramp.WidthBottom).to.equal(226);
		ramp.WidthTop = 854; expect(ramp.WidthTop).to.equal(854);
		ramp.Material = 'maathos'; expect(ramp.Material).to.equal('maathos');
		ramp.Type = 5; expect(ramp.Type).to.equal(5);
		ramp.Image = 'test_pattern'; expect(ramp.Image).to.equal('test_pattern');
		ramp.ImageAlignment = 0; expect(ramp.ImageAlignment).to.equal(0);
		ramp.ImageAlignment = 1; expect(ramp.ImageAlignment).to.equal(1);
		ramp.HasWallImage = false; expect(ramp.HasWallImage).to.equal(false);
		ramp.HasWallImage = true; expect(ramp.HasWallImage).to.equal(true);
		ramp.LeftWallHeight = 3.221; expect(ramp.LeftWallHeight).to.equal(3.221);
		ramp.RightWallHeight = 5.3984; expect(ramp.RightWallHeight).to.equal(5.3984);
		ramp.VisibleLeftWallHeight = 3.22; expect(ramp.VisibleLeftWallHeight).to.equal(3.22);
		ramp.VisibleRightWallHeight = 6.237; expect(ramp.VisibleRightWallHeight).to.equal(6.237);
		ramp.Elasticity = 0.339; expect(ramp.Elasticity).to.equal(0.339);
		ramp.Friction = 2.554; expect(ramp.Friction).to.equal(2.554);
		ramp.Scatter = 83.45; expect(ramp.Scatter).to.equal(83.45);
		ramp.Collidable = false; expect(ramp.Collidable).to.equal(false);
		ramp.Collidable = true; expect(ramp.Collidable).to.equal(true);
		ramp.HasHitEvent = false; expect(ramp.HasHitEvent).to.equal(false);
		ramp.HasHitEvent = true; expect(ramp.HasHitEvent).to.equal(true);
		ramp.Threshold = 1.003; expect(ramp.Threshold).to.equal(1.003);
		ramp.Visible = false; expect(ramp.Visible).to.equal(false);
		ramp.Visible = true; expect(ramp.Visible).to.equal(true);
		ramp.ReflectionEnabled = false; expect(ramp.ReflectionEnabled).to.equal(false);
		ramp.ReflectionEnabled = true; expect(ramp.ReflectionEnabled).to.equal(true);
		ramp.DepthBias = 2.332; expect(ramp.DepthBias).to.equal(2.332);
		ramp.WireDiameter = 12; expect(ramp.WireDiameter).to.equal(12);
		ramp.WireDistanceX = 1.2; expect(ramp.WireDistanceX).to.equal(1.2);
		ramp.WireDistanceY = 3.2; expect(ramp.WireDistanceY).to.equal(3.2);
		ramp.PhysicsMaterial = 'physmat'; expect(ramp.PhysicsMaterial).to.equal('physmat');
		ramp.OverwritePhysics = false; expect(ramp.OverwritePhysics).to.equal(false);
		ramp.OverwritePhysics = true; expect(ramp.OverwritePhysics).to.equal(true);
	});

	it('should not crash when executing unused APIs', () => {
		const ramp = table.ramps.Flat.getApi();
		expect(ramp.InterfaceSupportsErrorInfo({})).to.equal(false);
	});

});