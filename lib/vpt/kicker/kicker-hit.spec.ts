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

describe('The VPinball kicker collision', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-kicker.vpx')));
	});

	beforeEach(() => {
		player = new Player(table);
	});

	describe('in legacy mode', () => {

		it('should collide with the ball and keep the ball',  () => {

			// above kicker
			const ball = createBall(player, 128, 1200, 0, 0, 2);

			// let it roll down
			player.updatePhysics(0);
			player.updatePhysics(700);

			// make sure it's fixed
			expect(ball.getState().pos.x).to.be.above(127);
			expect(ball.getState().pos.x).to.be.below(128);
			expect(ball.getState().pos.y).to.be.above(1325);
			expect(ball.getState().pos.y).to.be.below(1326);
			expect(ball.getState().pos.z).to.be.above(0);

			// make sure it's still there
			player.updatePhysics(1000);
			expect(ball.getState().pos.x).to.be.above(127);
			expect(ball.getState().pos.x).to.be.below(128);
			expect(ball.getState().pos.y).to.be.above(1325);
			expect(ball.getState().pos.y).to.be.below(1326);
			expect(ball.getState().pos.z).to.be.above(0);
		});

		it('should collide with the ball and fall through',  () => {

			// above fallthrough kicker (it's Cup2)
			const ball = createBall(player, 247, 1200, 0, 0, 2);

			// let it roll down
			player.updatePhysics(0);
			player.updatePhysics(700);

			// assert it fell through
			expect(ball.getState().pos.z).to.be.below(-100);
		});

		it('should collide with the ball and fall through',  () => {

			// above fallthrough kicker (it's Cup2)
			const ball = createBall(player, 247, 1200, 0, 0, 2);

			// let it roll down
			player.updatePhysics(0);
			player.updatePhysics(700);

			// assert it fell through
			expect(ball.getState().pos.z).to.be.below(-100);
		});

		it('should let the ball roll over it not enabled',  () => {

			// above disabled kicker (it's HoleSimple)
			const ball = createBall(player, 623, 1200, 0, 0, 2);

			// let it roll down
			player.updatePhysics(0);
			player.updatePhysics(2000);

			// make sure it's below the kicker
			expect(ball.getState().pos.y).to.be.above(1700);
			expect(ball.getState().pos.z).to.be.above(0);
		});

	});

	it('should collide with the ball and keep the ball',  () => {

		// above kicker
		const ball = createBall(player, 874, 1200, 0, 0, 2);

		debugBall(player, ball);

		// let it roll down
		// player.updatePhysics(0);
		// player.updatePhysics(700);
		//
		// // make sure it's fixed
		// expect(ball.getState().pos.x).to.be.above(127);
		// expect(ball.getState().pos.x).to.be.below(128);
		// expect(ball.getState().pos.y).to.be.above(1325);
		// expect(ball.getState().pos.y).to.be.below(1326);
		// expect(ball.getState().pos.z).to.be.above(0);
		//
		// // make sure it's still there
		// player.updatePhysics(1000);
		// expect(ball.getState().pos.x).to.be.above(127);
		// expect(ball.getState().pos.x).to.be.below(128);
		// expect(ball.getState().pos.y).to.be.above(1325);
		// expect(ball.getState().pos.y).to.be.below(1326);
		// expect(ball.getState().pos.z).to.be.above(0);
	});

	// add second ball
});
