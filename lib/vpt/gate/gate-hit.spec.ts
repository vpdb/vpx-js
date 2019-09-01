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

describe('The VPinball gate collision', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-gate.vpx')));
		player = new Player(table).init();
	});

	it('should block the ball on a one-way gate', () => {
		const ball = createBall(player, 530, 1340, 0, 0, 2);
		expect(ball.getState().pos.y).to.equal(1340);

		// gate hit!
		player.updatePhysics(370);
		expect(ball.getState().pos.y).to.be.within(1400, 1405);

		// still there?
		player.updatePhysics(600);
		expect(ball.getState().pos.y).to.be.within(1400, 1405);
	});

	it('should let the ball through a two-way gate', () => {
		const ball = createBall(player, 380, 1340, 0, 0, 2);
		expect(ball.getState().pos.y).to.equal(1340);

		// gate hit!
		player.updatePhysics(370);
		expect(ball.getState().pos.y).to.be.within(1400, 1405);

		// down there?
		player.updatePhysics(600);
		expect(ball.getState().pos.y).to.be.above(1440);
	});

	it('should let the ball through a one-way gate', () => {
		const ball = createBall(player, 530, 1500, 0, 0, -10);
		expect(ball.getState().pos.y).to.equal(1500);

		player.updatePhysics(500);
		expect(ball.getState().pos.y).to.be.below(1130);

		player.updatePhysics(1000);
		expect(ball.getState().pos.y).to.be.below(810);
	});

});
