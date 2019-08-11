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
import { createBall } from '../../../test/physics.helper';
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
		expect(ball.getState().pos.x).to.be.above(395);
		expect(ball.getState().pos.x).to.be.below(398);
		expect(ball.getState().pos.y).to.be.above(1648);
		expect(ball.getState().pos.y).to.be.below(1650);
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
});
