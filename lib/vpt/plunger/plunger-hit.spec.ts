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
import * as sinonChai from 'sinon-chai';
import { createBall } from '../../../test/physics.helper';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball plunger collision', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-plunger.vpx')));
	});

	beforeEach(() => {
		player = new Player(table).init();
	});

	it('should collide with the plunger', () => {

		// create ball
		const ball = createBall(player, 333, 1700, 0, 0, 2);

		// let it roll down to the plunger
		player.updatePhysics(0);
		player.updatePhysics(700);

		expect(ball.getState().pos.y).to.be.within(1814, 1817);
	});

	it('should collide with the side of the plunger', () => {

		// create ball
		const ball = createBall(player, 255, 1870, 0, 5, 5);

		player.updatePhysics(0);
		expect(ball.getState().pos.x).to.be.below(260);

		player.updatePhysics(40);
		expect(ball.getState().pos.x).to.be.above(270);

		player.updatePhysics(160);
		expect(ball.getState().pos.x).to.be.below(270);
	});

	it('should move down along with the plunger', () => {

		// create ball
		const ball = createBall(player, 333, 1700, 0, 0, 2);
		const plunger = table.plungers.ModernPlunger.getApi();

		// let it roll down to the plunger
		player.updatePhysics(0);
		player.updatePhysics(700);

		// pull down plunger
		plunger.PullBack();
		player.updatePhysics(1870);

		expect(ball.getState().pos.y).to.be.within(1894, 1898);
	});

	it('should fire the ball to the top', () => {

		// create ball
		const ball = createBall(player, 333, 1700, 0, 0, 2);
		const plunger = table.plungers.ModernPlunger.getApi();

		plunger.PullBack();

		// let it roll down to the pulled down plunger
		player.updatePhysics(0);
		player.updatePhysics(1500);

		expect(ball.getState().pos.y).to.be.within(1894, 1898);

		// fire!
		plunger.Fire();
		player.updatePhysics(2800);

		expect(ball.getState().pos.y).to.be.below(100);
	});

});
