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
import { Mesh } from '../../refs.node';
import { ThreeRenderApi } from '../../render/threejs/three-render-api';
import { Table } from '../table/table';
import { TableExporter } from '../table/table-exporter';
import { PlungerMover } from './plunger-mover';
import { PlungerState } from './plunger-state';

chai.use(require('sinon-chai'));
const three = new ThreeHelper();
const renderApi = new ThreeRenderApi();

describe('The VPinball plunger physics', () => {

	let table: Table;
	let exporter: TableExporter;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-plunger.vpx')));
		exporter = new TableExporter(table);
	});

	beforeEach(() => {
		player = new Player(table).init();
		player.simulateTime(50); // move to start position
	});

	it('should be in the correct initial state', async () => {
		const plunger = table.plungers.CustomPlunger!;
		const plungerMover = plunger.getMover() as PlungerMover;

		const parkFrame = plungerMover.cFrames - 1;

		const plungerState = popState(player, 'CustomPlunger');
		expect(plungerState.frame).to.equal(parkFrame);
	});

	it('should move to the end when pulled back', async () => {
		const plunger = table.plungers.CustomPlunger;
		const plungerMover = plunger.getMover() as PlungerMover;
		const endPosition = plunger.getApi().Y;

		plunger.pullBack();

		for (let i = 0; i < 1000; i += 5) {
			player.simulateTime(i);
			console.log('%s: %s', i, plunger.getState().frame);
		}

		player.simulateTime(50);

		const plungerState = popState(player, 'CustomPlunger');
		expect(plungerState.frame).to.equal(0);
		expect(plungerMover.pos).to.equal(endPosition);
	});

	it('should move back after being fired', async () => {
		const plunger = table.plungers.CustomPlunger;
		const plungerMover = plunger.getMover() as PlungerMover;
		const parkFrame = plungerMover.cFrames - 1;

		plunger.pullBack();
		player.simulateTime(50);
		plunger.fire();
		player.simulateTime(500);

		const plungerState = popState(player, 'CustomPlunger');
		expect(plungerState.frame).to.equal(parkFrame);
	});

	it('should only fire a little when auto-fire is disabled', async () => {
		const plunger = table.plungers.CustomPlunger;
		const plungerMover = plunger.getMover() as PlungerMover;
		const parkFrame = plungerMover.cFrames - 1;
		const plungerState = plunger.getState();

		plunger.fire();

		player.updatePhysics(50);
		expect(plungerState.frame).to.equal(21);

		player.updatePhysics(300);
		expect(popState(player, 'CustomPlunger').frame).to.equal(parkFrame);
	});

	it('should fire fully when auto-fire is enabled', async () => {
		const plunger = table.plungers.AutoPlunger;

		plunger.fire();

		const plungerState = popState(player, 'AutoPlunger');
		expect(plungerState.frame).to.equal(0);
	});

	it('should apply the mesh transformation when animated', async () => {

		// create scene
		const gltf = await three.loadGlb(await exporter.exportGlb());
		const plunger = table.plungers.CustomPlunger;

		// retrieve plunger
		const plungerObj = three.find<Mesh>(gltf, 'plungers', 'CustomPlunger');
		const rodObj = plungerObj.children.find(c => c.name === 'rod') as Mesh;
		const springObj = plungerObj.children.find(c => c.name === 'spring') as Mesh;

		// apply player state to plunger
		plunger.getUpdater().applyState(plungerObj, plunger.getState(), renderApi, table);
		rodObj.geometry.computeBoundingBox();
		springObj.geometry.computeBoundingBox();

		// get bounding boxes to compare with
		const rodY = rodObj.geometry.boundingBox.min.y;
		const springY = rodObj.geometry.boundingBox.min.y;

		// pull plunger
		plunger.pullBack();
		player.updatePhysics(200);

		// apply again
		plunger.getUpdater().applyState(plungerObj, plunger.getState(), renderApi, table);
		rodObj.geometry.computeBoundingBox();
		springObj.geometry.computeBoundingBox();

		// assert it's bigger now
		expect(rodObj.geometry.boundingBox.min.y).to.be.above(rodY);
		expect(springObj.geometry.boundingBox.min.y).to.be.above(springY);
	});

});

function popState(player: Player, name: string): PlungerState {
	const states = player.popStates();
	return states.getState<PlungerState>(name);
}
