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
import * as sinonChai from 'sinon-chai';
import { createBall } from '../../../test/physics.helper';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { PlayerPhysics } from '../../game/player-physics';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { degToRad, radToDeg } from '../../math/float';
import { Table } from '../table/table';
import { Spinner } from './spinner';
import { SpinnerState } from './spinner-state';

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball spinner collision', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-spinner.vpx')));
	});

	beforeEach(() => {
		player = new Player(table).init();
	});

	it('should make the spinner spin', () => {

		const spinner = table.spinners.Transformed;

		// create ball
		createBall(player, 400, 1000, 0, 0, 10);

		// assert initial position
		expect(spinner.getState().angle).to.equal(0);

		// wait for hit
		player.updatePhysics(0);
		player.updatePhysics(160);

		// assert rotated position
		expect(spinner.getState().angle).to.be.above(5);
	});

	it('should make blocked spinner spin', () => {

		const spinner = table.spinners.Spinner;

		// create ball
		const kicker = table.kickers.BallRelease.getApi();
		const ball = kicker.CreateBall();
		kicker.Kick(0, -10);

		// assert initial position
		expect(spinner.getState().angle).to.equal(0);

		// wait for hit
		player.updatePhysics(0);
		player.updatePhysics(250);

		// assert rotated position
		expect(spinner.getState().angle).to.be.below(degToRad(-70));

		// assert it stays in defined angles
		for (let i = 0; i <= 200; i++) {
			player.updatePhysics(260 + i * 10);
			expect(spinner.getState().angle).to.be.within(degToRad(spinner.angleMin), degToRad(spinner.angleMax));
		}
	});

	it('should pop the correct state', () => {
		const spinner = table.spinners.Transformed;

		// create ball
		createBall(player, 400, 1000, 0, 0, 10);

		// assert initial position
		expect(spinner.getState().angle).to.equal(0);

		// wait for hit
		player.updatePhysics(0);
		player.updatePhysics(160);

		const state = player.popStates().getState<SpinnerState>('Transformed');
		expect(state.angle).to.equal(spinner.getState().angle);
	});

});

/**
 * Let time pass while logging the spinner rotation.
 * @param physics
 * @param spinner
 * @param numCycles How many cycles to run
 * @param cycleLength Duration of each cycle
 */
export function debugSpinner(physics: PlayerPhysics, spinner: Spinner, numCycles = 300, cycleLength = 5) {
	for (let i = 0; i <= numCycles; i++) {
		physics.updatePhysics(i * cycleLength);
		// tslint:disable-next-line:no-console
		console.log('[%sms] %s (%s°)', i * cycleLength, spinner.getState().angle, radToDeg(spinner.getState().angle));
	}
}
