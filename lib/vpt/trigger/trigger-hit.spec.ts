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
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';
import { TriggerState } from './trigger-state';

import sinonChai = require('sinon-chai');

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball trigger collision', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-trigger.vpx')));
	});

	beforeEach(() => {
		player = new Player(table);
	});

	it('should collide with the ball and animate',  () => {
		const trigger = table.triggers.WireB;
		const kicker = table.kickers.BallRelease.getApi();
		kicker.CreateBall();
		kicker.Kick(0, -1);

		// let it roll down some
		player.updatePhysics(0);
		player.updatePhysics(750);

		expect(trigger.getState().heightOffset).to.equal(0);

		// let it collide
		player.updatePhysics(800);

		expect(trigger.getState().heightOffset).to.equal(-32);

		// let it roll over and animate back
		player.updatePhysics(1150);

		expect(trigger.getState().heightOffset).to.equal(0);
	});

	it('should collide with the ball and animate when a button trigger is hit',  () => {
		const trigger = table.triggers.Button;
		createBall(player, 174, 1300, 0, 0, 2);

		// let it roll down some
		player.updatePhysics(0);
		player.updatePhysics(500);

		expect(trigger.getState().heightOffset).to.equal(0);

		// let it collide
		player.updatePhysics(600);

		expect(trigger.getState().heightOffset).to.equal(-2.5);

		// let it roll over and animate back
		player.updatePhysics(820);

		expect(trigger.getState().heightOffset).to.equal(0);
	});

	it('should pop the correct state', () => {
		const trigger = table.triggers.WireB;
		const kicker = table.kickers.BallRelease.getApi();
		kicker.CreateBall();
		kicker.Kick(0, -1);

		// for (let i = 0; i < 1500; i += 16.66666) {
		// 	player.updatePhysics(i);
		// 	console.log(i, trigger.getState().heightOffset);
		// }

		// let it roll onto trigger
		player.updatePhysics(0);
		player.updatePhysics(900);
		const state = player.popStates().WireB.newState as TriggerState;
		expect(state.heightOffset).to.equal(trigger.getState().heightOffset);
	});

});
