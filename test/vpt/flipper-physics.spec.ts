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

import { ThreeHelper } from '../three.helper';
import { Table } from '../../lib';
import { NodeBinaryReader } from '../../lib/io/binary-reader.node';
import { Player } from '../../lib/game/player';
import { spy } from 'sinon';
import { expect } from 'chai';
import * as chai from 'chai';
import sinonChai = require('sinon-chai');
import { degToRad } from '../../lib/math/float';
import { FlipperState } from '../../lib/vpt/flipper/flipper-state';
import { FlipperMover } from '../../lib/vpt/flipper/flipper-mover';

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball flipper physics', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-flipper.vpx')));
		player = new Player(table);
	});

	it('should move to the end when solenoid is on', async () => {

		const flipper = table.flippers.FlipperR;
		const flipperMover = flipper.getMover() as FlipperMover;
		const endAngleRad = degToRad(flipper.getFlipperData().endAngle);

		const callback = spy();
		player.setOnStateChanged(callback);

		flipper.rotateToEnd();
		simulateCycles(player, 500);

		expect(flipperMover.angleCur).to.equal(endAngleRad);
		expect(callback).to.have.been.calledWith('FlipperR', new FlipperState(endAngleRad));
	});

	it('should move to the start when solenoid is off again', async () => {

		const flipper = table.flippers.FlipperR;
		const flipperMover = flipper.getMover() as FlipperMover;
		const startAngleRad = degToRad(flipper.getFlipperData().startAngle);

		// move up
		flipper.rotateToEnd();
		simulateCycles(player, 500);

		const callback = spy();
		player.setOnStateChanged(callback);

		// move down again
		flipper.rotateToStart();
		simulateCycles(player, 500);

		expect(flipperMover.angleCur).to.equal(startAngleRad);
		expect(callback).to.have.been.calledWith('FlipperR', new FlipperState(startAngleRad));
	});
});


function simulateCycles(player: Player, duration: number, tickDuration = 1) {
	const numTicks = Math.floor(duration / tickDuration);
	for (let i = 0; i < numTicks; i++) {
		player.physicsSimulateCycle(tickDuration);
		player.updatePhysics();
	}
}
