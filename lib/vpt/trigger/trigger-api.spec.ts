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
import { PlayerPhysics } from '../../game/player-physics';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';

import sinon = require('sinon');
import sinonChai = require('sinon-chai');
import { Player } from '../../game/player';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball trigger API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-trigger.vpx')));
		player = new Player(table);
	});

	it('should correctly read and write the properties', async () => {
		const trigger = table.triggers.WireB.getApi();

		trigger.X = 13735; expect(trigger.X).to.equal(13735);
		trigger.Y = 53625; expect(trigger.Y).to.equal(53625);
		trigger.Radius = 243.34; expect(trigger.Radius).to.equal(243.34);
		trigger.Surface = 'sir face'; expect(trigger.Surface).to.equal('sir face');
		trigger.Enabled = false; expect(trigger.Enabled).to.equal(false);
		trigger.Enabled = true; expect(trigger.Enabled).to.equal(true);
		trigger.Visible = false; expect(trigger.Visible).to.equal(false);
		trigger.Visible = true; expect(trigger.Visible).to.equal(true);
		trigger.HitHeight = 554.987; expect(trigger.HitHeight).to.equal(554.987);
		trigger.Rotation = 3.14159; expect(trigger.Rotation).to.equal(3.14159);
		trigger.WireThickness = 4; expect(trigger.WireThickness).to.equal(4);
		trigger.AnimSpeed = 3.5; expect(trigger.AnimSpeed).to.equal(3.5);
		trigger.Material = 'material world'; expect(trigger.Material).to.equal('material world');
		trigger.TriggerShape = 3; expect(trigger.TriggerShape).to.equal(3);
		trigger.ReflectionEnabled = false; expect(trigger.ReflectionEnabled).to.equal(false);
		trigger.ReflectionEnabled = true; expect(trigger.ReflectionEnabled).to.equal(true);

		trigger.Name = 'nahme me'; expect(trigger.Name).to.equal('nahme me');
		trigger.TimerInterval = 231; expect(trigger.TimerInterval).to.equal(231);
		trigger.TimerEnabled = false; expect(trigger.TimerEnabled).to.equal(false);
		trigger.TimerEnabled = true; expect(trigger.TimerEnabled).to.equal(true);
	});

	it('should count and destroy a ball that is over the trigger', () => {

		const trigger = table.triggers.WireB.getApi();
		const kicker = table.kickers.BallRelease.getApi();

		kicker.CreateBall();
		kicker.Kick(0, -1);

		// let it collide
		player.updatePhysics(800);

		const numBalls = trigger.BallCntOver();

		expect(player.balls.length).to.equal(1);
		expect(numBalls).to.equal(1);

		trigger.DestroyBall();
		expect(player.balls.length).to.equal(0);
	});

	it('should not destroy a ball that is not over the trigger', () => {
		const trigger = table.triggers.WireB.getApi();
		const kicker = table.kickers.BallRelease.getApi();

		kicker.CreateBall();
		kicker.Kick(0, -1);

		// let it collide
		player.updatePhysics(10);

		expect(player.balls.length).to.equal(1);

		trigger.DestroyBall();
		expect(player.balls.length).to.equal(1);
	});

	it('should not collide neither animate when disabled',  () => {
		const trigger = table.triggers.WireB.getApi();
		const kicker = table.kickers.BallRelease.getApi();

		trigger.Enabled = false;
		kicker.CreateBall();
		kicker.Kick(0, -1);

		// let it collide
		player.updatePhysics(0);
		player.updatePhysics(800);

		// still same pos!
		expect(table.triggers.WireB.getState().heightOffset).to.equal(0);
	});

	it('should trigger a hit event',  () => {
		const trigger = table.triggers.WireB.getApi();
		const kicker = table.kickers.BallRelease.getApi();

		const eventSpy = sinon.spy();
		trigger.on('Hit', eventSpy);

		kicker.CreateBall();
		kicker.Kick(0, -1);

		player.updatePhysics(0);
		expect(eventSpy).to.have.been.not.called;

		player.updatePhysics(800);
		expect(eventSpy).to.have.been.calledOnce;
	});

	it('should trigger an unhit event',  () => {
		const trigger = table.triggers.WireB.getApi();
		const kicker = table.kickers.BallRelease.getApi();

		const eventSpy = sinon.spy();
		trigger.on('Unhit', eventSpy);

		kicker.CreateBall();
		kicker.Kick(0, -1);

		player.updatePhysics(800);
		expect(eventSpy).to.have.been.not.called;

		player.updatePhysics(1110);
		expect(eventSpy).to.have.been.calledOnce;
	});

	it('should not crash when executing unused APIs', () => {
		const trigger = table.triggers.WireB.getApi();
		expect(trigger.InterfaceSupportsErrorInfo({})).to.equal(false);
	});

});
