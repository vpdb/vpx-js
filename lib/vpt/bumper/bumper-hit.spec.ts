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
import { Mesh, Vector3 } from '../../refs.node';
import { ThreeRenderApi } from '../../render/threejs/three-render-api';
import { Table } from '../table/table';
import { TableExporter } from '../table/table-exporter';
import { BumperState } from './bumper-state';

chai.use(sinonChai);
const three = new ThreeHelper();
const renderApi = new ThreeRenderApi();

describe('The VPinball bumper collision', () => {

	let table: Table;
	let exporter: TableExporter;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-bumper.vpx')));
		exporter = new TableExporter(table);
		player = new Player(table).init();
	});

	it('should eject the ball when hit threshold has passed', () => {
		// put ball on top of flipper face
		const ball = createBall(player, 450, 750, 50, 0, 1);

		expect(ball.getState().pos.x).to.equal(450);

		player.simulateTime(500);
		expect(ball.getState().pos.x).to.equal(450);

		player.simulateTime(1100);
		expect(ball.getState().pos.x).to.be.within(75, 85);
		expect(ball.getState().pos.y).to.be.below(600);

	});

	it('should just collide when hitting under the threshold limit', () => {
		const ball = createBall(player, 450, 750, 50, 0, 0.5);
		expect(ball.getState().pos.x).to.equal(450);

		player.simulateTime(500);
		expect(ball.getState().pos.x).to.equal(450);

		player.simulateTime(1100);
		expect(ball.getState().pos.x).to.be.within(430, 440);
		expect(ball.getState().pos.y).to.be.above(800);
	});

	it('should animate the ring when hit', () => {
		createBall(player, 450, 750, 50, 0, 1);
		const bumper = table.bumpers.Bumper2;

		player.simulateTime(10);
		expect(bumper.getState().ringOffset).to.equal(0);
		player.simulateTime(700);
		expect(bumper.getState().ringOffset).to.be.closeTo(-8.33, 0.01);
		player.simulateTime(780);
		expect(bumper.getState().ringOffset).to.be.closeTo(-41.66, 0.01);
		player.simulateTime(840);
		expect(bumper.getState().ringOffset).to.be.closeTo(-20, 0.01);
		player.simulateTime(900);
		expect(bumper.getState().ringOffset).to.equal(0);
	});

	it('should apply the ring transformation to the object', async () => {
		// create scene
		const gltf = await three.loadGlb(await exporter.exportGlb());

		// add ball
		createBall(player, 450, 750, 50, 0, 1);
		const ringPos = new Vector3();
		const bumper = table.bumpers.Bumper2;
		const bumperObj = three.find<Mesh>(gltf, 'bumpers', 'Bumper2');
		const ringObj = bumperObj.children.find(o => o.name === `bumper-ring-Bumper2`)!;

		player.simulateTime(710);
		let states = player.popStates();
		let state = states.getState<BumperState>('Bumper2');
		bumper.getUpdater().applyState(bumperObj, state, renderApi, table);
		ringObj.getWorldPosition(ringPos);
		expect(ringPos.z).to.be.closeTo(8.33, 0.01);

		player.simulateTime(770);
		states = player.popStates();
		state = states.getState<BumperState>('Bumper2');
		bumper.getUpdater().applyState(bumperObj, state, renderApi, table);
		ringObj.getWorldPosition(ringPos);
		expect(ringPos.z).to.be.closeTo(50, 0.01);
	});

});
