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

import { expect } from 'chai';
import { ThreeHelper } from '../../test/three.helper';
import { Player } from '../game/player';
import { NodeBinaryReader } from '../io/binary-reader.node';
import { Table } from '../vpt/table/table';

/* tslint:disable:no-unused-expression */
describe('The VPinball player', () => {

	const three = new ThreeHelper();

	it('should pause and resume the game', async () => {
		const table = await Table.load(new NodeBinaryReader(three.fixturePath('table-kicker.vpx')));
		const player = new Player(table).init();
		const kicker = table.kickers.BallRelease.getApi();

		const ball = kicker.CreateBall();
		kicker.Kick(0, 10);

		player.simulateTime(0);
		expect(ball.getState().pos.y).to.equal(1200);

		player.simulateTime(120);
		expect(ball.getState().pos.y).to.be.below(1100);

		player.pause();
		player.simulateTime(700);
		expect(ball.getState().pos.y).to.be.above(1090);

		player.resume();
		player.simulateTime(1400);
		expect(ball.getState().pos.y).to.be.below(650);
	});
});
