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

describe('The VPinball rubber collision', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-rubber.vpx')));
	});

	beforeEach(() => {
		player = new Player(table);
	});

	it('should make the ball bounce off', () => {

		const kicker = table.kickers.BallRelease;

		// create ball
		const ball = player.createBall(kicker);
		kicker.getApi().Kick(-45, -5);

		// let it roll down some
		player.updatePhysics(0);
		player.updatePhysics(700);

		// assert it's moving down right
		expect(ball.getState().pos.x).to.be.above(400);
		expect(ball.getState().pos.y).to.be.above(400);

		// let it hit and bounce back
		player.updatePhysics(1200);

		// assert it bounced back
		expect(ball.getState().pos.x).to.be.below(400);
		expect(ball.getState().pos.y).to.be.below(400);
	});
});
