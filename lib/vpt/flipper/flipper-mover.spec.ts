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
import { simulateCycles } from '../../../test/physics.helper';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { degToRad } from '../../math/float';
import { Table } from '../table';
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
		const flipperMover = flipper.getMover() as FlipperMover;
		const endAngleRad = degToRad(flipper.getFlipperData().endAngle);

		const callback = spy();
		player.setOnStateChanged(callback);

		flipper.rotateToEnd();
		simulateCycles(player, 25);

		expect(flipperMover.angleCur).to.equal(endAngleRad);
		expect(callback).to.have.been.calledWith('FlipperR', new FlipperState(endAngleRad));
	});

	it('should move to the start when solenoid is off again', async () => {

		const flipper = table.flippers.FlipperR;
		const flipperMover = flipper.getMover() as FlipperMover;
		const startAngleRad = degToRad(flipper.getFlipperData().startAngle);

		// move up
		flipper.rotateToEnd();
		simulateCycles(player, 25); // hit at 17.012061224193429107ms (at 1000fps)

		const callback = spy();
		player.setOnStateChanged(callback);

		// move down again
		flipper.rotateToStart();
		simulateCycles(player, 80);

		expect(flipperMover.angleCur).to.equal(startAngleRad);
		expect(callback).to.have.been.calledWith('FlipperR', new FlipperState(startAngleRad));
	});

	it('should move back to end when pressed while moving', async () => {

		const flipper = table.flippers.FlipperR;
		const flipperMover = flipper.getMover() as FlipperMover;
		const startAngleRad = degToRad(flipper.getFlipperData().startAngle);
		const endAngleRad = degToRad(flipper.getFlipperData().endAngle);

		// move up
		flipper.rotateToEnd();
		simulateCycles(player, 25); // hit at 17.012061224193429107ms (at 1000fps)

		// move down
		flipper.rotateToStart();
		simulateCycles(player, 25);

		// assert it's in the middle
		const turningAngle = flipperMover.angleCur;
		expect(turningAngle).to.be.above(startAngleRad);
		expect(turningAngle).to.be.below(endAngleRad);

		// move up again
		flipper.rotateToEnd();
		simulateCycles(player, 10);

		// assert it's back up in less than half the time
		expect(flipperMover.angleCur).to.equal(endAngleRad);
	});

	it('should correctly serialize state', () => {
		const state1 = new FlipperState(1);
		const state2 = FlipperState.fromSerialized({ angle: 1.0 });
		const state3 = new FlipperState(1.00000001);
		expect(state1.equals(state2)).to.equal(true);
		expect(state2.equals(state3)).to.equal(true);
		expect(state3.equals((null as unknown) as FlipperState)).to.equal(false);
	});

});
