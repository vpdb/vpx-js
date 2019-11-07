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
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { degToRad } from '../../math/float';
import { Table } from '../table/table';
import { FlipperState } from './flipper-state';

chai.use(require('sinon-chai'));
const three = new ThreeHelper();

describe('The VPinball flipper physics', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-flipper.vpx')));
	});

	beforeEach(() => {
		player = new Player(table).init();
	});

	it('should move to the end when solenoid is on', async () => {

		const flipper = table.flippers.FlipperR;
		const flipperState = flipper.getState();
		const endAngleRad = degToRad(flipper.getFlipperData().endAngle);

		flipper.getApi().RotateToEnd();
		player.simulateTime(100);

		expect(flipperState.angle).to.equal(endAngleRad);
	});

	it('should move to the start when solenoid is off again', async () => {

		const flipper = table.flippers.FlipperR;
		const flipperState = flipper.getState();
		const startAngleRad = degToRad(flipper.getFlipperData().startAngle);

		// move up
		flipper.getApi().RotateToEnd();
		player.updatePhysics(52); // hit at 51ms

		// move down again
		flipper.getApi().RotateToStart();
		player.updatePhysics(300);

		expect(flipperState.angle).to.equal(startAngleRad);
	});

	it('should move back to end when pressed while moving', async () => {

		const flipper = table.flippers.FlipperR;
		const flipperState = flipper.getState();
		const startAngleRad = degToRad(flipper.getFlipperData().startAngle);
		const endAngleRad = degToRad(flipper.getFlipperData().endAngle);

		// move up
		flipper.getApi().RotateToEnd();
		player.updatePhysics(52); // hit at 51ms
		expect(flipperState.angle).to.be.above(startAngleRad);

		// move down
		flipper.getApi().RotateToStart();
		player.updatePhysics(200);

		// assert it's in the middle
		expect(flipperState.angle).to.be.above(startAngleRad);
		expect(flipperState.angle).to.be.below(endAngleRad);

		// move up again
		flipper.getApi().RotateToEnd();
		player.updatePhysics(500);

		// assert it's back up in less than half the time
		expect(flipperState.angle).to.equal(endAngleRad);
	});

	it('should return the proper state', () => {
		const flipper = table.flippers.FlipperR;

		// move up
		flipper.getApi().RotateToEnd();
		player.simulateTime(25); // hit at 17.012061224193429107ms (at 1000fps)

		const flipperState = flipper.getState();
		const states = player.popStates();

		const poppedState = states.getState<FlipperState>('FlipperR');

		expect(flipperState.name).to.eql(poppedState.name);
		expect(flipperState.angle).to.eql(poppedState.angle);
		expect(flipperState.equals(undefined as unknown as FlipperState)).to.equal(false);
		states.release();
	});

});
