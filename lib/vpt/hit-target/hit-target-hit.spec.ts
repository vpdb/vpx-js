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
import { HitTargetState } from './hit-target-state';

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball hit target collision', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-hit-target.vpx')));
		player = new Player(table).init();
	});

	describe('of a drop target', () => {

		it('should block the ball on a drop target on first hit', () => {
			const dropTarget = table.hitTargets.DropTargetBeveled.getApi();
			const ball = createBall(player, dropTarget.X, dropTarget.Y + 100, 0, 0, -10);

			// // assert ball moving up
			player.updatePhysics(30);
			expect(ball.getState().pos.y).to.be.below(1148);
			player.updatePhysics(50);
			expect(ball.getState().pos.y).to.be.below(1130);
			player.updatePhysics(70);
			expect(ball.getState().pos.y).to.be.below(1115);

			// assert ball moving down
			player.updatePhysics(100);
			expect(ball.getState().pos.y).to.be.above(1115);
			player.updatePhysics(130);
			expect(ball.getState().pos.y).to.be.above(1120);
			player.updatePhysics(200);
			expect(ball.getState().pos.y).to.be.above(1130);
		});

		it('should let the ball through on second hit', () => {
			const dropTarget = table.hitTargets.DropTargetBeveled.getApi();
			const ball = createBall(player, dropTarget.X, dropTarget.Y + 100, 0, 0, -10);

			// assert ball moving up
			player.updatePhysics(200);
			expect(ball.getState().pos.y).to.be.above(1130);

			player.destroyBall(ball);

			const ball2 = createBall(player, dropTarget.X, dropTarget.Y + 100, 0, 0, -10);
			//debugBall(player, ball2, 300, 5, 200);

			player.updatePhysics(300);
			expect(ball2.getState().pos.y).to.be.below(1085);
			player.updatePhysics(500);
			expect(ball2.getState().pos.y).to.be.below(940);
			player.updatePhysics(1000);
			expect(ball2.getState().pos.y).to.be.below(610);
		});

		it('should let the ball through when drop target is manually dropped', () => {
			const dropTarget = table.hitTargets.DropTargetBeveled.getApi();
			const ball = createBall(player, dropTarget.X, dropTarget.Y + 300, 0, 0, -10);

			// drop
			dropTarget.IsDropped = true;

			player.updatePhysics(100);
			expect(ball.getState().pos.y).to.be.below(1290);
			player.updatePhysics(550);
			expect(ball.getState().pos.y).to.be.below(1000);
			player.updatePhysics(1000);
			expect(ball.getState().pos.y).to.be.below(690);
		});
	});

	describe('of a hit target', () => {

		it('should block the ball on a drop target on first and second hit', () => {
			const hitTarget = table.hitTargets.HitFatTargetSquare.getApi();
			const ball = createBall(player, hitTarget.X, hitTarget.Y + 100, 0, 0, -10);

			// assert ball moving up
			player.updatePhysics(30);
			expect(ball.getState().pos.y).to.be.below(1148);
			player.updatePhysics(50);
			expect(ball.getState().pos.y).to.be.below(1130);
			player.updatePhysics(70);
			expect(ball.getState().pos.y).to.be.below(1115);

			// assert ball moving down
			player.updatePhysics(100);
			expect(ball.getState().pos.y).to.be.above(1110);
			player.updatePhysics(130);
			expect(ball.getState().pos.y).to.be.above(1115);
			player.updatePhysics(200);
			expect(ball.getState().pos.y).to.be.above(1125);

			// second ball
			player.destroyBall(ball);
			const ball2 = createBall(player, hitTarget.X, hitTarget.Y + 100, 0, 0, -10);

			// assert ball moving down
			player.updatePhysics(300);
			expect(ball2.getState().pos.y).to.be.above(1110);
			player.updatePhysics(330);
			expect(ball2.getState().pos.y).to.be.above(1115);
			player.updatePhysics(400);
			expect(ball2.getState().pos.y).to.be.above(1125);
		});
	});

	it('should pop the correct state', () => {
		const dropTarget = table.hitTargets.DropTargetBeveled.getApi();
		dropTarget.IsDropped = true;

		player.updatePhysics(200);
		const state = player.popStates().getState<HitTargetState>('DropTargetBeveled').newState;
		expect(state.zOffset).to.equal(table.hitTargets.DropTargetBeveled.getState().zOffset);
	});
});
