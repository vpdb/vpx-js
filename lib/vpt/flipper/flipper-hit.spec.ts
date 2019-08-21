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
import { Table } from '../..';
import { createBall, debugBall } from '../../../test/physics.helper';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';

import sinonChai = require('sinon-chai');
import { radToDeg } from '../../math/float';
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball flipper collision', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-flipper.vpx')));
	});

	beforeEach(() => {
		player = new Player(table);
	});

	it('should collide with the ball when hitting on the face',  () => {

		// put ball on top of flipper face
		const ball = createBall(player, 350, 1600, 0);

		player.updatePhysics(0);
		player.updatePhysics(2000);

		expect(ball.getState().pos.x).to.be.above(420); // diverted to the right
		expect(ball.getState().pos.y).to.be.above(1650); // but still below
	});

	it('should collide with the ball when hitting on the end',  () => {

		// put ball on top of flipper end
		const ball = createBall(player, 420, 1645, 0);

		player.updatePhysics(0);
		player.updatePhysics(2000);

		expect(ball.getState().pos.x).to.be.above(460); // diverted to the right
		expect(ball.getState().pos.y).to.be.above(1670); // but still below
	});

	it('should roll on the flipper', () => {

		// put ball on top of flipper
		const ball = createBall(player, 310, 1590, 0);

		player.updatePhysics(0);
		player.updatePhysics(2000);

		// assert it's on flipper's bottom
		expect(ball.getState().pos.x).to.be.within(393, 401);
		expect(ball.getState().pos.y).to.be.within(1647, 1651);
	});

	it('should move the ball up', () => {

		const flipper = table.flippers.DefaultFlipper;

		// put ball on top of flipper
		const ball = createBall(player, 310, 1590, 0);

		// let it roll a bit
		player.updatePhysics(0);
		player.updatePhysics(1500);

		// now, flip
		flipper.rotateToEnd();
		player.updatePhysics(1550);

		// should be moving top right
		expect(ball.getState().pos.x).to.be.above(380);
		expect(ball.getState().pos.y).to.be.below(1550);
	});

	it('should push the coil down when hit with high speed', () => {

		const flipper = table.flippers.DefaultFlipper;
		createBall(player, 395, 1547, 0, 0, 20);

		// assert initial flipper position
		expect(radToDeg(flipper.getState().angle)).to.equal(121);

		// let it collide
		player.updatePhysics(0);
		player.updatePhysics(100);

		expect(radToDeg(flipper.getState().angle)).to.be.below(115);
	});

	it('should move when hit at the same time', () => {

		const flipper = table.flippers.DefaultFlipper;

		// shoot ball onto flipper and flip at the same time
		const ball = createBall(player, 420, 1550, 0, 0, 5);
		flipper.rotateToEnd();

		player.updatePhysics(0);
		player.updatePhysics(280);

		// should be moving up
		expect(ball.getState().pos.y).to.be.below(830);

		// now, flip
		flipper.rotateToEnd();
		player.updatePhysics(1550);
	});

	it('should slide on the flipper', () => {

		// shoot ball parallel onto flipper
		const ball = createBall(player, 214, 1520, 0, 10, 7.1);

		player.updatePhysics(0);
		expect(ball.getState().pos.x).to.equal(214);
		expect(ball.getState().pos.y).to.equal(1520);

		player.updatePhysics(50);
		expect(ball.getState().pos.x).to.be.within(259, 263);
		expect(ball.getState().pos.y).to.be.within(1552, 1556);

		player.updatePhysics(100);
		expect(ball.getState().pos.x).to.be.within(306, 310);
		expect(ball.getState().pos.y).to.be.within(1586, 1590);

		player.updatePhysics(150);
		expect(ball.getState().pos.x).to.be.within(350, 354);
		expect(ball.getState().pos.y).to.be.within(1617, 1621);
	});

	it('should move the flipper up when hit from below', () => {

		const flipper = table.flippers.DefaultFlipper;

		// shoot ball from below onto flipper
		createBall(player, 374, 1766, 0, 0, -10);

		player.updatePhysics(0);
		expect(radToDeg(flipper.getState().angle)).to.equal(121);

		player.updatePhysics(50);
		expect(radToDeg(flipper.getState().angle)).to.be.below(121);

		player.updatePhysics(100);
		expect(radToDeg(flipper.getState().angle)).to.be.below(110);

		player.updatePhysics(150);
		expect(radToDeg(flipper.getState().angle)).to.be.above(110);

		player.updatePhysics(200);
		expect(radToDeg(flipper.getState().angle)).to.equal(121);
	});
});
