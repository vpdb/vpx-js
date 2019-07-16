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
import { simulateCycles } from '../../../test/physics.helper';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table';
import { PlungerMover } from './plunger-mover';
import { PlungerState } from './plunger-state';

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball plunger physics', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-plunger.vpx')));
	});

	beforeEach(() => {
		player = new Player(table);
		simulateCycles(player, 50); // move to start position
	});

	it('should be in the correct initial state', async () => {
		const plunger = table.plungers.find(p => p.getName() === 'CustomPlunger')!;
		const plungerMover = plunger.getMover() as PlungerMover;

		const parkFrame = plungerMover.cFrames - 1;

		const plungerState = popState(player, 'CustomPlunger');
		expect(plungerState.frame).to.equal(parkFrame);
	});

	it('should move to the end when pulled back', async () => {
		const plunger = table.plungers.find(p => p.getName() === 'CustomPlunger')!;
		const plungerMover = plunger.getMover() as PlungerMover;
		const endPosition = plunger.getData().center.y;

		plunger.pullBack();
		simulateCycles(player, 50);

		const plungerState = popState(player, 'CustomPlunger');
		expect(plungerState.frame).to.equal(0);
		expect(plungerMover.pos).to.equal(endPosition);
	});

	it('should move back after being fired', async () => {
		const plunger = table.plungers.find(p => p.getName() === 'CustomPlunger')!;
		const plungerMover = plunger.getMover() as PlungerMover;
		const parkFrame = plungerMover.cFrames - 1;

		plunger.pullBack();
		simulateCycles(player, 50);
		plunger.fire();
		simulateCycles(player, 500);

		const plungerState = popState(player, 'CustomPlunger');
		expect(plungerState.frame).to.equal(parkFrame);
	});

	it('should only fire a little when auto-fire is disabled', async () => {
		const plunger = table.plungers.find(p => p.getName() === 'CustomPlunger')!;
		const plungerMover = plunger.getMover() as PlungerMover;
		const parkFrame = plungerMover.cFrames - 1;

		plunger.fire();
		simulateCycles(player, 50);

		let plungerState = popState(player, 'CustomPlunger');
		expect(plungerState.frame).to.equal(21);

		simulateCycles(player, 180);
		plungerState = popState(player, 'CustomPlunger');
		expect(plungerState.frame).to.equal(parkFrame);
	});

	it('should fire fully when auto-fire is enabled', async () => {
		const plunger = table.plungers.find(p => p.getName() === 'AutoPlunger')!;

		plunger.fire();

		const plungerState = popState(player, 'AutoPlunger');
		expect(plungerState.frame).to.equal(0);
	});

});

function popState(player: Player, name: string): PlungerState {
	const state = player.popState();
	return (state as any)[name] as PlungerState;
}
