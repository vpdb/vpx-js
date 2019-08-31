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

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball ramp collision', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-ramp.vpx')));
	});

	beforeEach(() => {
		player = new Player(table);
	});

	it('should make the ball roll up and down a flat ramp', () => {

		const kicker = table.kickers.BallRelease.getApi();

		// create ball
		const ball = kicker.CreateBall();
		kicker.Kick(170, -20);
		expect(ball.getState().pos.y).to.equal(1163);

		// let it roll up
		player.updatePhysics(500);
		expect(ball.getState().pos.y).to.be.below(710);

		// let it roll down again
		player.updatePhysics(1000);
		expect(ball.getState().pos.y).to.be.above(1030);
	});

	it('should make the ball roll down a two-wire ramp', () => {

		// create ball
		const ball = createBall(player, 595, 571, 105);

		expect(ball.getState().pos.x).to.be.within(594, 596);
		expect(ball.getState().pos.y).to.be.within(570, 571);
		expect(ball.getState().pos.z).to.be.within(129, 130);

		player.updatePhysics(200);
		expect(ball.getState().pos.x).to.be.within(581, 583);
		expect(ball.getState().pos.y).to.be.within(599, 601);
		expect(ball.getState().pos.z).to.be.within(96, 98);

		player.updatePhysics(400);
		expect(ball.getState().pos.x).to.be.within(536, 538);
		expect(ball.getState().pos.y).to.be.within(694, 696);
		expect(ball.getState().pos.z).to.be.within(82, 84);

		player.updatePhysics(600);
		expect(ball.getState().pos.x).to.be.within(509, 511);
		expect(ball.getState().pos.y).to.be.within(844, 846);
		expect(ball.getState().pos.z).to.be.within(62, 64);

		player.updatePhysics(800);
		expect(ball.getState().pos.x).to.be.within(572, 574);
		expect(ball.getState().pos.y).to.be.within(1032, 1034);
		expect(ball.getState().pos.z).to.be.within(32, 35);
	});
});
