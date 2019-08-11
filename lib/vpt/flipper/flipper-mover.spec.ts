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
import { spy } from 'sinon';
import sinonChai = require('sinon-chai');
import { Table } from '../..';
import { simulateCycles } from '../../../test/physics.helper';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { degToRad } from '../../math/float';
import { FlipperMover } from './flipper-mover';
import { FlipperState } from './flipper-state';

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball flipper physics', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-flipper.vpx')));
	});

	beforeEach(() => {
		player = new Player(table);
	});

	it('should move to the end when solenoid is on', async () => {

		const flipper = table.flippers.FlipperR;
		const flipperState = flipper.getState();
		const endAngleRad = degToRad(flipper.getFlipperData().endAngle);

		flipper.rotateToEnd();
		simulateCycles(player, 25);

		expect(flipperState.angle).to.equal(endAngleRad);
	});

	it('should move to the start when solenoid is off again', async () => {

		const flipper = table.flippers.FlipperR;
		const flipperState = flipper.getState();
		const startAngleRad = degToRad(flipper.getFlipperData().startAngle);

		// move up
		flipper.rotateToEnd();
		simulateCycles(player, 25); // hit at 17.012061224193429107ms (at 1000fps)

		// move down again
		flipper.rotateToStart();
		simulateCycles(player, 80);

		expect(flipperState.angle).to.equal(startAngleRad);
	});

	it('should move back to end when pressed while moving', async () => {

		const flipper = table.flippers.FlipperR;
		const flipperState = flipper.getState();
		const startAngleRad = degToRad(flipper.getFlipperData().startAngle);
		const endAngleRad = degToRad(flipper.getFlipperData().endAngle);

		// move up
		flipper.rotateToEnd();
		simulateCycles(player, 25); // hit at 17.012061224193429107ms (at 1000fps)

		// move down
		flipper.rotateToStart();
		simulateCycles(player, 25);

		// assert it's in the middle
		const turningAngle = flipperState.angle;
		expect(turningAngle).to.be.above(startAngleRad);
		expect(turningAngle).to.be.below(endAngleRad);

		// move up again
		flipper.rotateToEnd();
		simulateCycles(player, 10);

		// assert it's back up in less than half the time
		expect(flipperState.angle).to.equal(endAngleRad);
	});

	it('should return the proper state', () => {
		const flipper = table.flippers.FlipperR;

		// move up
		flipper.rotateToEnd();
		simulateCycles(player, 25); // hit at 17.012061224193429107ms (at 1000fps)

		const flipperState = flipper.getState();
		const states = player.popState();

		const poppedState = states.find(s => s.getName() === 'FlipperR');

		expect(flipperState).to.equal(poppedState);
		expect(flipperState.equals(undefined as unknown as FlipperState)).to.equal(false);
	});

});
