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
import { Table } from '../..';
import { createBall, debugBall } from '../../../test/physics.helper';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball surface collision', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-surface.vpx')));
		player = new Player(table);
	});

	it('should make the ball bounce off the sides', () => {

		const kicker = table.kickers.BallRelease.getApi();

		// create ball
		const ball = kicker.CreateBall();
		kicker.Kick(90, 10);

		// let it roll right some
		player.updatePhysics(0);
		player.updatePhysics(170);

		// assert it's moving down right
		expect(ball.getState().pos.x).to.be.above(300);

		// let it hit and bounce back
		player.updatePhysics(200);

		// assert it bounced back
		expect(ball.getState().pos.x).to.be.below(300);
	});

	it('should make the ball collide on top', () => {

		// create ball
		const ball = createBall(player, 500, 500, 200, 0, 5);

		// let it roll right some
		player.updatePhysics(0);
		player.updatePhysics(300);

		// assert the ball is still on top of the surface
		expect(ball.getState().pos.z).to.be.above(75);

		// let the ball fall down
		player.updatePhysics(750);

		// assert it bounced back
		expect(ball.getState().pos.z).to.be.below(26);
	});

	it('should bounce off a slingshot', async () => {

		const slingshotTable = await Table.load(new NodeBinaryReader(three.fixturePath('table-slingshot.vpx')));
		player = new Player(slingshotTable);

		const slingshotKicker = slingshotTable.kickers.SlingShotKicker.getApi();
		const wallKicker = slingshotTable.kickers.WallKicker.getApi();

		const ball1 = slingshotKicker.CreateBall();
		const ball2 = wallKicker.CreateBall();

		slingshotKicker.Kick(0, -2);
		wallKicker.Kick(0, -2);

		expect(ball1.getState().pos.y).to.equal(1050);
		expect(ball2.getState().pos.y).to.equal(1050);

		// let them hit the walls and bounce back
		player.updatePhysics(1470);

		// ball 1 should be up top, while ball 2 hitting the wall should be on the wall
		expect(ball1.getState().pos.y).to.be.below(500);
		expect(ball2.getState().pos.y).to.be.within(1170, 1180);
	});

	it('should not collide with anything when dropped',  () => {

		// create ball
		const ball = createBall(player, 350, 230, 0, 0, 10);

		// drop wall
		const wall = table.surfaces.Wall.getApi();
		wall.CanDrop = true;
		wall.IsDropped = true;

		player.updatePhysics(0);
		player.updatePhysics(100);

		// should go right through
		expect(ball.getState().pos.y).to.be.above(240);
	});

	it('should not hit anything when disabled',  () => {

		// create ball
		const ball = createBall(player, 350, 230, 0, 0, 10);

		// disable wall
		const wall = table.surfaces.Wall.getApi();
		wall.Disabled = true;

		player.updatePhysics(0);
		player.updatePhysics(100);

		// should go right through
		expect(ball.getState().pos.y).to.be.above(240);
	});

	it('should not collide with anything when collidable set to false', () => {
		// create ball
		const ball = createBall(player, 350, 230, 0, 0, 10);

		// set colliable to false
		const wall = table.surfaces.Wall.getApi();
		wall.Collidable = false;

		player.updatePhysics(0);
		player.updatePhysics(100);

		// should go right through
		expect(ball.getState().pos.y).to.be.above(240);
	});

	it('should fire the ball up when slingshot is triggered manually', async () => {
		const slingshotTable = await Table.load(new NodeBinaryReader(three.fixturePath('table-slingshot.vpx')));
		player = new Player(slingshotTable);

		const slingShot = table.surfaces.Wall.getApi();

		// set threshold to 10 so it doesn't immediately fire
		slingShot.SlingshotThreshold = 10;

		// then lay ball onto it
		createBall(player, 400, 1174, 0);

		slingShot.PlaySlingshotHit();

		// todo assert something, apparently it's not that the ball is supposed to be hit.
	});

});
