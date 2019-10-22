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
import { radToDeg } from '../../math/float';
import { Table } from '../table/table';
import { GateState } from './gate-state';

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball gate mover', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-gate.vpx')));
	});

	beforeEach(() => {
		player = new Player(table).init();
	});

	it('should make the two-way gate bracket move', () => {

		const gate = table.gates.Plate;

		// create ball
		createBall(player, 380, 1340, 0, 0, 10);

		// assert initial position
		expect(gate.getState().angle).to.equal(0);

		player.updatePhysics(100);
		expect(radToDeg(gate.getState().angle)).to.be.within(73, 75);
		player.updatePhysics(150);
		expect(radToDeg(gate.getState().angle)).to.be.within(13, 16);
		player.updatePhysics(200);
		expect(radToDeg(gate.getState().angle)).to.be.within(-81, -79);
		player.updatePhysics(300);
		expect(radToDeg(gate.getState().angle)).to.be.within(33, 35);
		player.updatePhysics(600);
		expect(radToDeg(gate.getState().angle)).to.be.within(-81, -79);
		player.updatePhysics(1990);
		expect(radToDeg(gate.getState().angle)).to.be.within(-32, -30);
	});

	it('should make the two-way gate bracket stand still', () => {

		const gate = table.gates.Plate;

		// create ball
		createBall(player, 380, 1340, 0, 0, 2);

		// assert initial position
		expect(gate.getState().angle).to.equal(0);

		// for (let i = 0; i < 500; i++) {
		// 	player.updatePhysics(i * 10);
		// 	console.log(i * 10, radToDeg(gate.getState().angle));
		// }

		player.updatePhysics(500);
		expect(radToDeg(gate.getState().angle)).to.be.above(40);
		player.updatePhysics(4090);
		expect(gate.getState().angle).to.equal(0);
	});

	it('should make the gate one-way gate bracket move and stand still', () => {

		const gate = table.gates.WireRectangle;

		// create ball
		createBall(player, 530, 1500, 0, 0, -10);

		// assert initial position
		expect(gate.getState().angle).to.equal(0);

		player.updatePhysics(100);
		expect(radToDeg(gate.getState().angle)).to.be.within(69, 71);
		player.updatePhysics(150);
		expect(radToDeg(gate.getState().angle)).to.be.within(73, 75);
		player.updatePhysics(200);
		expect(radToDeg(gate.getState().angle)).to.be.within(79, 81);
		player.updatePhysics(1000);
		expect(radToDeg(gate.getState().angle)).to.be.within(36, 38);
		player.updatePhysics(1970);
		expect(gate.getState().angle).to.equal(0);
	});

	it('should return the proper state', () => {
		const gate = table.gates.WireRectangle;

		// create ball
		createBall(player, 530, 1500, 0, 0, -10);

		// assert initial position
		expect(gate.getState().angle).to.equal(0);

		player.updatePhysics(150);

		const gateState = gate.getState();
		const states = player.popStates();

		const poppedState = states.getState<GateState>('WireRectangle');

		expect(gateState.name).to.equal(poppedState.name);
		expect(gateState.angle).to.equal(poppedState.angle);
		expect(gateState.equals(undefined as unknown as GateState)).to.equal(false);
	});

});
