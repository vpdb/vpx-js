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

describe('The VPinball bumper API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-bumper.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const bumper = table.bumpers.Bumper3.getApi();

		bumper.Radius = 22.5; expect(bumper.Radius).to.equal(22.5);
		bumper.Force = 1.23; expect(bumper.Force).to.equal(1.23);
		bumper.Scatter = 98238; expect(bumper.Scatter).to.equal(98238);
		bumper.HeightScale = 2; expect(bumper.HeightScale).to.equal(2);
		bumper.RingSpeed = 122; expect(bumper.RingSpeed).to.equal(122);
		bumper.RingDropOffset = -5; expect(bumper.RingDropOffset).to.equal(-5);
		bumper.Orientation = 270; expect(bumper.Orientation).to.equal(270);
		bumper.Threshold = 0.115; expect(bumper.Threshold).to.equal(0.115);
		bumper.CapMaterial = 'CapMaterial'; expect(bumper.CapMaterial).to.equal('CapMaterial');
		bumper.RingMaterial = 'RingMaterial'; expect(bumper.RingMaterial).to.equal('RingMaterial');
		bumper.BaseMaterial = 'BaseMaterial'; expect(bumper.BaseMaterial).to.equal('BaseMaterial');
		bumper.SkirtMaterial = 'SkirtMaterial'; expect(bumper.SkirtMaterial).to.equal('SkirtMaterial');
		bumper.X = 5586; expect(bumper.X).to.equal(5586);
		bumper.Y = 15547; expect(bumper.Y).to.equal(15547);
		bumper.Surface = 'Surface'; expect(bumper.Surface).to.equal('Surface');
		bumper.HasHitEvent = false; expect(bumper.HasHitEvent).to.equal(false);
		bumper.HasHitEvent = true; expect(bumper.HasHitEvent).to.equal(true);
		bumper.Collidable = false; expect(bumper.Collidable).to.equal(false);
		bumper.Collidable = true; expect(bumper.Collidable).to.equal(true);
		bumper.CapVisible = false; expect(bumper.CapVisible).to.equal(false);
		bumper.CapVisible = true; expect(bumper.CapVisible).to.equal(true);
		bumper.BaseVisible = false; expect(bumper.BaseVisible).to.equal(false);
		bumper.BaseVisible = true; expect(bumper.BaseVisible).to.equal(true);
		bumper.RingVisible = false; expect(bumper.RingVisible).to.equal(false);
		bumper.RingVisible = true; expect(bumper.RingVisible).to.equal(true);
		bumper.SkirtVisible = false; expect(bumper.SkirtVisible).to.equal(false);
		bumper.SkirtVisible = true; expect(bumper.SkirtVisible).to.equal(true);
		bumper.ReflectionEnabled = false; expect(bumper.ReflectionEnabled).to.equal(false);
		bumper.ReflectionEnabled = true; expect(bumper.ReflectionEnabled).to.equal(true);
		bumper.EnableSkirtAnimation = false; expect(bumper.EnableSkirtAnimation).to.equal(false);
		bumper.EnableSkirtAnimation = true; expect(bumper.EnableSkirtAnimation).to.equal(true);
	});

	it('should animate the bumper', () => {
		const bumper = table.bumpers.Bumper1;

		bumper.getApi().PlayHit();

		player.updatePhysics(10);
		expect(bumper.getState().ringOffset).to.equal(0);
		player.updatePhysics(20);
		expect(bumper.getState().ringOffset).to.equal(-8);
	});

	it('should not animate the bumper when the ring is invisible', () => {
		const bumper = table.bumpers.Bumper1;

		bumper.getApi().RingVisible = false;
		bumper.getApi().PlayHit();

		player.updatePhysics(10);
		expect(bumper.getState().ringOffset).to.equal(0);
		player.updatePhysics(20);
		expect(bumper.getState().ringOffset).to.equal(0);
	});

	it('should not crash when executing unused APIs', () => {
		const bumper = table.bumpers.Bumper1.getApi();
		expect(bumper.InterfaceSupportsErrorInfo({})).to.equal(false);
	});

});
