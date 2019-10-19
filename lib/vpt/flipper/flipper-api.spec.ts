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
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball flipper API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-flipper.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const flipper = table.flippers.DefaultFlipper.getApi();

		flipper.X = 23; expect(flipper.X).to.equal(23);
		flipper.Y = 512; expect(flipper.Y).to.equal(512);
		flipper.BaseRadius = 2547; expect(flipper.BaseRadius).to.equal(2547);
		flipper.EndRadius = 9984; expect(flipper.EndRadius).to.equal(9984);
		flipper.Length = 23.12; expect(flipper.Length).to.equal(23.12);
		flipper.EOSTorque = 2.31234; expect(flipper.EOSTorque).to.equal(2.31234);
		flipper.EOSTorqueAngle = 1.11265; expect(flipper.EOSTorqueAngle).to.equal(1.11265);
		flipper.Surface = 'suuhrfeiz'; expect(flipper.Surface).to.equal('suuhrfeiz');
		flipper.StartAngle = 0.01; expect(flipper.StartAngle).to.equal(0.01);
		flipper.EndAngle = 2.035; expect(flipper.EndAngle).to.equal(2.035);
		expect(flipper.CurrentAngle).to.not.be.undefined;
		flipper.Material = 'kkasdou'; expect(flipper.Material).to.equal('kkasdou');
		flipper.Mass = 10.01; expect(flipper.Mass).to.equal(10.01);
		flipper.OverridePhysics = 1; expect(flipper.OverridePhysics).to.equal(1);
		flipper.OverridePhysics = 0; expect(flipper.OverridePhysics).to.equal(0);
		flipper.RubberMaterial = 'sodkfuw'; expect(flipper.RubberMaterial).to.equal('sodkfuw');
		flipper.RubberThickness = 12; expect(flipper.RubberThickness).to.equal(12);
		flipper.RubberWidth = 22.21; expect(flipper.RubberWidth).to.equal(22.21);
		flipper.RubberHeight = 519.332; expect(flipper.RubberHeight).to.equal(519.332);
		flipper.Strength = 1.1102; expect(flipper.Strength).to.equal(1.1102);
		flipper.Visible = false; expect(flipper.Visible).to.equal(false);
		flipper.Visible = true; expect(flipper.Visible).to.equal(true);
		flipper.Enabled = false; expect(flipper.Enabled).to.equal(false);
		flipper.Enabled = true; expect(flipper.Enabled).to.equal(true);
		flipper.Elasticity = 22.3312; expect(flipper.Elasticity).to.equal(22.3312);
		flipper.ElasticityFalloff = 0.0054; expect(flipper.ElasticityFalloff).to.equal(0.0054);
		flipper.Scatter = 1.658; expect(flipper.Scatter).to.equal(1.658);
		flipper.Friction = 5.3354; expect(flipper.Friction).to.equal(5.3354);
		flipper.RampUp = 6654; expect(flipper.RampUp).to.equal(6654);
		flipper.Height = 12; expect(flipper.Height).to.equal(12);
		flipper.Return = 9.994; expect(flipper.Return).to.equal(1);
		flipper.Return = -20; expect(flipper.Return).to.equal(0);
		flipper.Return = 0.55479; expect(flipper.Return).to.equal(0.55479);
		flipper.FlipperRadiusMin = 1.556; expect(flipper.FlipperRadiusMin).to.equal(1.556);
		flipper.FlipperRadiusMin = -1; expect(flipper.FlipperRadiusMin).to.equal(0);
		flipper.Image = 'ldr'; expect(flipper.Image).to.equal('ldr');
		flipper.ReflectionEnabled = false; expect(flipper.ReflectionEnabled).to.equal(false);
		flipper.ReflectionEnabled = true; expect(flipper.ReflectionEnabled).to.equal(true);

		flipper.Name = 'superdupername'; expect(flipper.Name).to.equal('superdupername');
		flipper.TimerInterval = 3214; expect(flipper.TimerInterval).to.equal(3214);
		flipper.TimerEnabled = false; expect(flipper.TimerEnabled).to.equal(false);
		flipper.TimerEnabled = true; expect(flipper.TimerEnabled).to.equal(true);

		flipper.UserValue = 'qwertz'; expect(flipper.UserValue).to.equal('qwertz');
	});

	it('should not set values that are overridden when overwrite toggled', () => {
		const flipper = table.flippers.DefaultFlipper.getApi();
		table.data!.overridePhysics = 1;
		table.data!.overridePhysicsFlipper = true;
		flipper.OverridePhysics = 1;

		flipper.Mass = 100; expect(flipper.Mass).to.equal(1);
		flipper.Strength = 100; expect(flipper.Strength).to.equal(2200);
		flipper.Elasticity = 100; expect(flipper.Elasticity).to.equal(0.8);
		flipper.Scatter = 100; expect(flipper.Scatter).to.equal(0);
		flipper.Return = 100; expect(flipper.Return).to.equal(0.058);
		flipper.ElasticityFalloff = 100; expect(flipper.ElasticityFalloff).to.equal(0.43);
		flipper.RampUp = 100; expect(flipper.RampUp).to.equal(3.0);
		flipper.EOSTorque = 100; expect(flipper.EOSTorque).to.equal(0.75);
		flipper.EOSTorqueAngle = 100; expect(flipper.EOSTorqueAngle).to.equal(6.0);

		// override ignored, probably bug in VP, doing same here.
		flipper.Friction = 100; expect(flipper.Friction).to.equal(100);
	});

	it('should not crash when executing unused APIs', () => {
		const flipper = table.flippers.DefaultFlipper.getApi();
		expect(flipper.InterfaceSupportsErrorInfo({})).to.equal(false);
	});

});
