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
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { PlayerPhysics } from '../../game/player-physics';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';
import { PlungerApi } from './plunger-api';

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball plunger API', () => {

	let table: Table;
	let player: Player;

	before(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-plunger.vpx')));
	});

	beforeEach(async () => {
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const plunger = table.plungers.ModernPlunger.getApi();

		plunger.X = 4; expect(plunger.X).to.equal(4);
		plunger.Y = 5; expect(plunger.Y).to.equal(5);
		plunger.Width = 5; expect(plunger.Width).to.equal(5);
		plunger.ZAdjust = 542; expect(plunger.ZAdjust).to.equal(542);
		plunger.Surface = 'plunger-surface'; expect(plunger.Surface).to.equal('plunger-surface');
		plunger.MechStrength = 0.3384; expect(plunger.MechStrength).to.equal(0.3384);
		plunger.MechPlunger = false; expect(plunger.MechPlunger).to.equal(false);
		plunger.MechPlunger = true; expect(plunger.MechPlunger).to.equal(true);
		plunger.AutoPlunger = false; expect(plunger.AutoPlunger).to.equal(false);
		plunger.AutoPlunger = true; expect(plunger.AutoPlunger).to.equal(true);
		plunger.Visible = false; expect(plunger.Visible).to.equal(false);
		plunger.Visible = true; expect(plunger.Visible).to.equal(true);
		plunger.ParkPosition = 6; expect(plunger.ParkPosition).to.equal(6);
		plunger.Stroke = 1.3387; expect(plunger.Stroke).to.equal(1.3387);
		plunger.ScatterVelocity = 32.304; expect(plunger.ScatterVelocity).to.equal(32.304);
		plunger.MomentumXfer = 2.443; expect(plunger.MomentumXfer).to.equal(2.443);
		plunger.ReflectionEnabled = false; expect(plunger.ReflectionEnabled).to.equal(false);
		plunger.PullSpeed = 1.0023; expect(plunger.PullSpeed).to.equal(1.0023);
		plunger.FireSpeed = 99.993; expect(plunger.FireSpeed).to.equal(99.993);
		plunger.Type = 2; expect(plunger.Type).to.equal(2);
		plunger.Material = 'some-mat'; expect(plunger.Material).to.equal('some-mat');
		plunger.AnimFrames = 12; expect(plunger.AnimFrames).to.equal(12);
		plunger.TipShape = 'tip-shape'; expect(plunger.TipShape).to.equal('tip-shape');
		plunger.RodDiam = 69; expect(plunger.RodDiam).to.equal(69);
		plunger.RingGap = 0.001; expect(plunger.RingGap).to.equal(0.001);
		plunger.RingDiam = 10.001; expect(plunger.RingDiam).to.equal(10.001);
		plunger.RingWidth = 12.221; expect(plunger.RingWidth).to.equal(12.221);
		plunger.SpringDiam = 6.06; expect(plunger.SpringDiam).to.equal(6.06);
		plunger.SpringGauge = 1.1102; expect(plunger.SpringGauge).to.equal(1.1102);
		plunger.SpringLoops = 1.2231; expect(plunger.SpringLoops).to.equal(1.2231);
		plunger.SpringEndLoops = 3.2231; expect(plunger.SpringEndLoops).to.equal(3.2231);

		plunger.Name = 'doh-duh'; expect(plunger.Name).to.equal('doh-duh');
		plunger.TimerInterval = 1234; expect(plunger.TimerInterval).to.equal(1234);
		plunger.TimerEnabled = false; expect(plunger.TimerEnabled).to.equal(false);
		plunger.TimerEnabled = true; expect(plunger.TimerEnabled).to.equal(true);

		plunger.UserValue = 'sup'; expect(plunger.UserValue).to.equal('sup');

		// reset table for next tests
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-plunger.vpx')));
	});

	it('should correctly handle image attribution', () => {
		const plunger = table.plungers.ModernPlunger.getApi();
		expect(() => plunger.Image = 'some-image').to.throw('Texture "some-image" not found.');
		//expect(() => plunger.Image = 'hdr-texture').to.throw('Cannot use a HDR image (.exr/.hdr) here');
		plunger.Image = 'texture'; expect(plunger.Image).to.equal('texture');
	});

	it('should create a ball', () => {
		const plunger = table.plungers.ModernPlunger.getApi();
		const ball = plunger.CreateBall();

		const x = (table.plungers.ModernPlunger.getMover().x + table.plungers.ModernPlunger.getMover().x2) * 0.5;
		const y = table.plungers.ModernPlunger.getMover().pos - (25.0 + 0.01);

		expect(Math.round(ball.getState().pos.x)).to.equal(Math.round(x));
		expect(Math.round(ball.getState().pos.y)).to.equal(Math.round(y));
		expect(ball.getState().pos.z).to.equal(25);
		expect(player.balls.length).to.equal(1);
	});

	it('should pull back the plunger', () => {
		const plunger = table.plungers.ModernPlunger.getApi();
		expect(table.plungers.ModernPlunger.getState().frame).to.equal(21);

		plunger.PullBack();

		player.updatePhysics(0);
		player.updatePhysics(100);

		expect(table.plungers.ModernPlunger.getState().frame).to.equal(0);
		expect(plunger.Position()).to.equal(25);
	});

	it('should fire the plunger when pulled back', () => {
		const plunger = table.plungers.ModernPlunger.getApi();
		expect(table.plungers.ModernPlunger.getState().frame).to.equal(21);

		plunger.PullBack();
		player.updatePhysics(0);
		player.updatePhysics(100);

		plunger.Fire();
		player.updatePhysics(360);

		expect(table.plungers.ModernPlunger.getState().frame).to.equal(25);
		expect(plunger.Position()).to.equal(0);
	});

	it('should fire the auto plunger', () => {
		const plunger = table.plungers.AutoPlunger.getApi();

		plunger.Fire();
		player.updatePhysics(0);
		expect(plunger.Position()).to.equal(25);

		player.updatePhysics(100);
		expect(plunger.Position()).to.be.within(5, 6);
	});

	it('should not crash when executing unused APIs', () => {
		const plunger = table.plungers.ModernPlunger.getApi();
		expect(plunger.MotionDevice()).to.equal(0);
		expect(plunger.InterfaceSupportsErrorInfo({})).to.equal(false);
	});
});

function debugPlunger(plunger: PlungerApi, physics: PlayerPhysics, table: Table, t = 0) {
	for (let i = 0; i < 300; i++) {
		physics.updatePhysics(t + i * 10);
		// tslint:disable-next-line:no-console
		console.log(t + i * 10, table.plungers.ModernPlunger.getState().frame, plunger.Position());
	}
}
