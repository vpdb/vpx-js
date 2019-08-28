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
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';

import sinonChai = require('sinon-chai');
import { createBall } from '../../../test/physics.helper';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball hit target API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-hit-target.vpx')));
		player = new Player(table);
	});

	it('should correctly read and write the properties', async () => {
		const dropTarget = table.hitTargets.DropTargetBeveled.getApi();

		//dropTarget.Image = 'ldr'; expect(dropTarget.Image).to.equal('ldr');
		dropTarget.Material = 'dtmat'; expect(dropTarget.Material).to.equal('dtmat');
		dropTarget.Visible = false; expect(dropTarget.Visible).to.equal(false);
		dropTarget.Visible = true; expect(dropTarget.Visible).to.equal(true);
		dropTarget.X = 4121; expect(dropTarget.X).to.equal(4121);
		dropTarget.Y = 531; expect(dropTarget.Y).to.equal(531);
		dropTarget.Z = 5234; expect(dropTarget.Z).to.equal(5234);
		dropTarget.ScaleX = 14121; expect(dropTarget.ScaleX).to.equal(14121);
		dropTarget.ScaleY = 2531; expect(dropTarget.ScaleY).to.equal(2531);
		dropTarget.ScaleZ = 35234; expect(dropTarget.ScaleZ).to.equal(35234);
		dropTarget.Orientation = 12.112; expect(dropTarget.Orientation).to.equal(12.112);
		dropTarget.HasHitEvent = false; expect(dropTarget.HasHitEvent).to.equal(false);
		dropTarget.HasHitEvent = true; expect(dropTarget.HasHitEvent).to.equal(true);
		dropTarget.Threshold = 11.5987; expect(dropTarget.Threshold).to.equal(11.5987);
		dropTarget.Elasticity = 394.20; expect(dropTarget.Elasticity).to.equal(394.20);
		dropTarget.ElasticityFalloff = 66.665; expect(dropTarget.ElasticityFalloff).to.equal(66.665);
		dropTarget.Friction = 22.1123; expect(dropTarget.Friction).to.equal(1);
		dropTarget.Friction = -22.1123; expect(dropTarget.Friction).to.equal(0);
		dropTarget.Friction = 0.1123; expect(dropTarget.Friction).to.equal(0.1123);
		dropTarget.Scatter = 0.33; expect(dropTarget.Scatter).to.equal(0.33);
		dropTarget.Collidable = false; expect(dropTarget.Collidable).to.equal(false);
		dropTarget.Collidable = true; expect(dropTarget.Collidable).to.equal(true);
		dropTarget.DisableLighting = false; expect(dropTarget.DisableLighting).to.equal(false);
		dropTarget.DisableLighting = true; expect(dropTarget.DisableLighting).to.equal(true);
		dropTarget.BlendDisableLighting = 0.665; expect(dropTarget.BlendDisableLighting).to.equal(0.665);
		dropTarget.BlendDisableLightingFromBelow = 1.335; expect(dropTarget.BlendDisableLightingFromBelow).to.equal(1.335);
		dropTarget.ReflectionEnabled = false; expect(dropTarget.ReflectionEnabled).to.equal(false);
		dropTarget.ReflectionEnabled = true; expect(dropTarget.ReflectionEnabled).to.equal(true);
		dropTarget.DropSpeed = 5.68; expect(dropTarget.DropSpeed).to.equal(5.68);
		dropTarget.LegacyMode = false; expect(dropTarget.LegacyMode).to.equal(false);
		dropTarget.LegacyMode = true; expect(dropTarget.LegacyMode).to.equal(true);
		dropTarget.DrawStyle = 4; expect(dropTarget.DrawStyle).to.equal(4);
		dropTarget.DrawStyle = 3; expect(dropTarget.DrawStyle).to.equal(3);
		dropTarget.PhysicsMaterial = 'htpmat'; expect(dropTarget.PhysicsMaterial).to.equal('htpmat');
		dropTarget.OverwritePhysics = false; expect(dropTarget.OverwritePhysics).to.equal(false);
		dropTarget.OverwritePhysics = true; expect(dropTarget.OverwritePhysics).to.equal(true);
		expect(dropTarget.HitThreshold).not.to.be.undefined;
		dropTarget.RaiseDelay = 23; expect(dropTarget.RaiseDelay).to.equal(23);
		dropTarget.DepthBias = 22.112; expect(dropTarget.DepthBias).to.equal(22.112);
		dropTarget.Name = 'drop taaahget neym'; expect(dropTarget.Name).to.equal('drop taaahget neym');
		dropTarget.TimerInterval = 1235; expect(dropTarget.TimerInterval).to.equal(1235);
		dropTarget.TimerEnabled = false; expect(dropTarget.TimerEnabled).to.equal(false);
		dropTarget.TimerEnabled = true; expect(dropTarget.TimerEnabled).to.equal(true);

		dropTarget.UserValue = 'dtuv'; expect(dropTarget.UserValue).to.equal('dtuv');
	});

	it('should drop and raise the drop target', () => {
		const dropTarget = table.hitTargets.DropTargetBeveled.getApi();

		// set to dropped
		dropTarget.IsDropped = true;
		expect(dropTarget.IsDropped).to.equal(false); // still raised

		// animate down
		player.updatePhysics(200);
		expect(dropTarget.IsDropped).to.equal(true);

		// set to raised
		dropTarget.IsDropped = false;
		expect(dropTarget.IsDropped).to.equal(true); // still dropped

		// animate up
		player.updatePhysics(420);
		expect(dropTarget.IsDropped).to.equal(false);

	});

});
