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
import { createBall } from '../../../test/physics.helper';
import { ThreeHelper } from '../../../test/three.helper';
import { PlayerPhysics } from '../../game/player-physics';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';

import sinonChai = require('sinon-chai');

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball ball collision', () => {

	let table: Table;
	let player: PlayerPhysics;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-empty.vpx')));
	});

	beforeEach(() => {
		player = new PlayerPhysics(table);
	});

	it('should hit the bottom of the playfield', async () => {

		const ball = createBall(player, 500, 2100, 0);

		player.updatePhysics(0);
		player.updatePhysics(2000);

		expect(Math.round(ball.getState().pos.y)).to.equal(2197);

		player.updatePhysics(3000);
		expect(Math.round(ball.getState().pos.y)).to.equal(2197);
	});

	it('should collide with two balls', async () => {
		const ball1 = createBall(player, 400, 1050, 0, 10, -10);
		const ball2 = createBall(player, 700, 1050, 0, -10, -10);

		player.updatePhysics(0);
		player.updatePhysics(110);
		expect(ball1.getState().pos.x).to.above(500);
		expect(ball2.getState().pos.x).to.below(600);

		player.updatePhysics(180);
		expect(ball1.getState().pos.x).to.below(500);
		expect(ball2.getState().pos.x).to.above(600);
	});

});
