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
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';

import sinonChai = require('sinon-chai');
import { debugBall } from '../../../test/physics.helper';

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

	it('should make the ball roll down again', () => {

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
});
