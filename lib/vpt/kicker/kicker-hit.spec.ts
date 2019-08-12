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

describe('The VPinball kicker collision', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-kicker.vpx')));
	});

	beforeEach(() => {
		player = new Player(table);
	});

	it('should collide with the ball and keep the ball',  () => {

		// put ball on top of flipper face
		const ball = createBall(player, 128, 1200, 0, 0, 2);

		player.updatePhysics(0);
		player.updatePhysics(1500);
		// expect(ball.getState().pos.x).to.be.above(120);
		// expect(ball.getState().pos.x).to.be.below(140);
		// expect(ball.getState().pos.y).to.be.above(1305);
		// expect(ball.getState().pos.y).to.be.below(1315);

		// for (let i = 0; i < 300; i++) {
		// 	player.updatePhysics(i * 5);
		// 	console.log('%s,%s', ball.getState().pos.x, ball.getState().pos.y, ball.getState().pos.z);
		// }
	});
});
