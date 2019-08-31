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
import { radToDeg } from '../../math/float';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
import sinonChai = require('sinon-chai');

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball gate API', () => {

	let table: Table;
	let player: PlayerPhysics;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-gate.vpx')));
		player = new PlayerPhysics(table);
	});

	it('should correctly read and write the properties', async () => {
		const twoWay = table.gates.Plate.getApi();
		const oneWay = table.gates.WireRectangle.getApi();

		twoWay.X = 2436; expect(twoWay.X).to.equal(2436);
		twoWay.Y = 4243; expect(twoWay.Y).to.equal(4243);
		twoWay.Length = 2134.223; expect(twoWay.Length).to.equal(2134.223);
		twoWay.Height = 23.9948; expect(twoWay.Height).to.equal(23.9948);
		twoWay.Rotation = 90.9; expect(twoWay.Rotation).to.equal(90.9);
		twoWay.Surface = 'gate-surface'; expect(twoWay.Surface).to.equal('gate-surface');
		twoWay.Material = 'gate-material'; expect(twoWay.Material).to.equal('gate-material');
		twoWay.Open = false; expect(twoWay.Open).to.equal(false);
		twoWay.Open = true; expect(twoWay.Open).to.equal(true);
		oneWay.Open = false; expect(oneWay.Open).to.equal(false);
		oneWay.Open = true; expect(oneWay.Open).to.equal(true);
		twoWay.Elasticity = 0.226; expect(twoWay.Elasticity).to.equal(0.226);
		twoWay.ShowBracket = false; expect(twoWay.ShowBracket).to.equal(false);
		twoWay.ShowBracket = true; expect(twoWay.ShowBracket).to.equal(true);

		twoWay.Collidable = false; expect(twoWay.Collidable).to.equal(false);
		twoWay.Collidable = true; expect(twoWay.Collidable).to.equal(true);
		oneWay.Collidable = false; expect(oneWay.Collidable).to.equal(false);
		oneWay.Collidable = true; expect(oneWay.Collidable).to.equal(true);
		twoWay.Friction = 1.3354; expect(twoWay.Friction).to.equal(1);
		twoWay.Friction = 0.3354; expect(twoWay.Friction).to.equal(0.3354);
		twoWay.Friction = -0.3354; expect(twoWay.Friction).to.equal(0);
		twoWay.Damping = 0.9987; expect(Math.round(twoWay.Damping * 1e5)).to.equal(Math.round(0.9987 * 1e5));
		twoWay.GravityFactor = 1.226; expect(twoWay.GravityFactor).to.equal(1);
		twoWay.GravityFactor = 0.226; expect(twoWay.GravityFactor).to.equal(0.226);
		twoWay.GravityFactor = -1.226; expect(twoWay.GravityFactor).to.equal(0);
		twoWay.Visible = false; expect(twoWay.Visible).to.equal(false);
		twoWay.Visible = true; expect(twoWay.Visible).to.equal(true);
		twoWay.TwoWay = false; expect(twoWay.TwoWay).to.equal(false);
		twoWay.TwoWay = true; expect(twoWay.TwoWay).to.equal(true);
		twoWay.ReflectionEnabled = false; expect(twoWay.ReflectionEnabled).to.equal(false);
		twoWay.ReflectionEnabled = true; expect(twoWay.ReflectionEnabled).to.equal(true);
		expect(twoWay.CurrentAngle).not.to.be.undefined;
		twoWay.DrawStyle = 3; expect(twoWay.DrawStyle).to.equal(3);

		twoWay.Name = 'gatename'; expect(twoWay.Name).to.equal('gatename');
		twoWay.TimerInterval = 5513; expect(twoWay.TimerInterval).to.equal(5513);
		twoWay.TimerEnabled = false; expect(twoWay.TimerEnabled).to.equal(false);
		twoWay.TimerEnabled = true; expect(twoWay.TimerEnabled).to.equal(true);

		twoWay.UserValue = 'qwerty'; expect(twoWay.UserValue).to.equal('qwerty');
	});

	it('should correctly set the opening and closing angles', () => { // note: what a shite api!
		const gate = table.gates.Plate.getApi();
		gate.Collidable = false;

		// should clamp
		gate.CloseAngle = -30.3;
		gate.OpenAngle = 100;
		expect(gate.CloseAngle).to.equal(0);
		expect(gate.OpenAngle).to.equal(90);

		// should apply close to open
		gate.CloseAngle = 60;
		expect(Math.round(gate.CloseAngle)).to.equal(60);
		gate.OpenAngle = 50;
		expect(gate.CloseAngle).to.equal(50);
		expect(gate.OpenAngle).to.equal(90);

		// should apply open to close
		gate.CloseAngle = 0;
		expect(gate.CloseAngle).to.equal(0);
		gate.OpenAngle = 70;
		expect(gate.OpenAngle).to.equal(70);
		gate.CloseAngle = 80;
		expect(gate.OpenAngle).to.equal(80);

		// should clamp and switch
		gate.CloseAngle = 10;
		gate.OpenAngle = 70;
		expect(gate.CloseAngle).to.equal(10);
		expect(gate.OpenAngle).to.equal(70);
		gate.OpenAngle = -10;
		expect(gate.CloseAngle).to.equal(0);
		expect(gate.OpenAngle).to.equal(70);
		gate.CloseAngle = 100;
		expect(gate.CloseAngle).to.equal(0);
		expect(gate.OpenAngle).to.equal(90);

		// unable to do anything if collidable
		gate.Collidable = true;
		expect(() => gate.CloseAngle = 0).to.throw("Gate is collidable! closing angles other than 0 aren't possible!");
		expect(() => gate.OpenAngle = 90).to.throw("Gate is collidable! open angles other than 90 aren't possible!");

		// todo test actual functionality
	});

	it('should correctly move manually on a two-way gate', () => {
		const plate = table.gates.Plate;
		plate.getApi().move(1, 1, 30);

		player.updatePhysics(0);
		expect(Math.round(radToDeg(plate.getState().angle))).to.equal(0);

		player.updatePhysics(50);
		expect(Math.round(radToDeg(plate.getState().angle))).to.equal(5);

		player.updatePhysics(200);
		expect(Math.round(radToDeg(plate.getState().angle))).to.equal(20);

		player.updatePhysics(300);
		expect(Math.round(radToDeg(plate.getState().angle))).to.equal(30);

		player.updatePhysics(500);
		expect(Math.round(radToDeg(plate.getState().angle))).to.equal(30);
	});

	it('should correctly move manually on a one-way gate', () => {
		const plate = table.gates.WireRectangle;
		plate.getApi().move(1, 1, 120);

		player.updatePhysics(0);
		expect(Math.round(radToDeg(plate.getState().angle))).to.equal(0);

		player.updatePhysics(50);
		expect(Math.round(radToDeg(plate.getState().angle))).to.equal(5);

		player.updatePhysics(200);
		expect(Math.round(radToDeg(plate.getState().angle))).to.equal(20);

		player.updatePhysics(300);
		expect(Math.round(radToDeg(plate.getState().angle))).to.equal(30);

		player.updatePhysics(500);
		expect(Math.round(radToDeg(plate.getState().angle))).to.equal(50);

		// for (let i = 0; i < 200; i++) {
		// 	player.updatePhysics(i * 10);
		// 	console.log(i * 10, radToDeg(plate.getState().angle));
		// }
	});

});
