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
import { TableBuilder } from '../../../test/table-builder';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Enums } from '../enums';
import { Table } from '../table/table';
import { RampState } from './ramp-state';

/* tslint:disable:no-unused-expression */
chai.use(require('sinon-chai'));
const three = new ThreeHelper();

describe('The VPinball ramp API', () => {

	it('should correctly read and write the properties', async () => {
		const table = await Table.load(new NodeBinaryReader(three.fixturePath('table-ramp.vpx')));
		new Player(table).init();
		const ramp = table.ramps.Flat.getApi();

		ramp.HeightBottom = 23;
		ramp.HeightTop = 523;
		ramp.WidthBottom = 226;
		ramp.WidthTop = 854;
		ramp.Material = 'maathos';
		ramp.Type = 5;
		ramp.Image = 'test_pattern';
		ramp.ImageAlignment = Enums.ImageAlignment.ImageAlignWorld; expect(ramp.ImageAlignment).to.equal(0);
		ramp.ImageAlignment = Enums.ImageAlignment.ImageAlignTopLeft;
		ramp.HasWallImage = false; expect(ramp.HasWallImage).to.equal(false);
		ramp.HasWallImage = true;
		ramp.LeftWallHeight = 3.221;
		ramp.RightWallHeight = 5.3984;
		ramp.VisibleLeftWallHeight = 3.22;
		ramp.VisibleRightWallHeight = 6.237;
		ramp.Elasticity = 0.339;
		ramp.Friction = 2.554;
		ramp.Scatter = 83.45;
		ramp.Collidable = false; expect(ramp.Collidable).to.equal(false);
		ramp.Collidable = true;
		ramp.HasHitEvent = false; expect(ramp.HasHitEvent).to.equal(false);
		ramp.HasHitEvent = true;
		ramp.Threshold = 1.003;
		ramp.Visible = false; expect(ramp.Visible).to.equal(false);
		ramp.Visible = true;
		ramp.ReflectionEnabled = false; expect(ramp.ReflectionEnabled).to.equal(false);
		ramp.ReflectionEnabled = true;
		ramp.DepthBias = 2.332;
		ramp.WireDiameter = 12;
		ramp.WireDistanceX = 1.2;
		ramp.WireDistanceY = 3.2;
		ramp.PhysicsMaterial = 'physmat';
		ramp.OverwritePhysics = false; expect(ramp.OverwritePhysics).to.equal(false);
		ramp.OverwritePhysics = true;

		expect(ramp.HeightBottom).to.equal(23);
		expect(ramp.HeightTop).to.equal(523);
		expect(ramp.WidthBottom).to.equal(226);
		expect(ramp.WidthTop).to.equal(854);
		expect(ramp.Material).to.equal('maathos');
		expect(ramp.Type).to.equal(5);
		expect(ramp.Image).to.equal('test_pattern');
		expect(ramp.ImageAlignment).to.equal(1);
		expect(ramp.HasWallImage).to.equal(true);
		expect(ramp.LeftWallHeight).to.equal(3.221);
		expect(ramp.RightWallHeight).to.equal(5.3984);
		expect(ramp.VisibleLeftWallHeight).to.equal(3.22);
		expect(ramp.VisibleRightWallHeight).to.equal(6.237);
		expect(ramp.Elasticity).to.equal(0.339);
		expect(ramp.Friction).to.equal(2.554);
		expect(ramp.Scatter).to.equal(83.45);
		expect(ramp.Collidable).to.equal(true);
		expect(ramp.HasHitEvent).to.equal(true);
		expect(ramp.Threshold).to.equal(1.003);
		expect(ramp.Visible).to.equal(true);
		expect(ramp.ReflectionEnabled).to.equal(true);
		expect(ramp.DepthBias).to.equal(2.332);
		expect(ramp.WireDiameter).to.equal(12);
		expect(ramp.WireDistanceX).to.equal(1.2);
		expect(ramp.WireDistanceY).to.equal(3.2);
		expect(ramp.PhysicsMaterial).to.equal('physmat');
		expect(ramp.OverwritePhysics).to.equal(true);
	});

	it('should update the state when static rendering is disabled', () => {
		const table = new TableBuilder()
			.addMaterial('mat', { isOpacityActive: true })
			.addMaterial('mat2')
			.addRamp('ramp', { szMaterial: 'mat' })
			.build();

		const player = new Player(table).init();
		const ramp = table.ramps.ramp.getApi();

		ramp.HeightBottom = 6;
		ramp.HeightTop = 54;
		ramp.WidthBottom = 89;
		ramp.WidthTop = 32;
		ramp.Material = 'mat2';
		ramp.Type = Enums.RampType.RampType1Wire;
		ramp.ImageAlignment = Enums.ImageAlignment.ImageAlignTopLeft;
		ramp.HasWallImage = false;
		ramp.LeftWallHeight = 3;
		ramp.RightWallHeight = 5;
		ramp.VisibleLeftWallHeight = 3;
		ramp.VisibleRightWallHeight = 6;
		ramp.DepthBias = 3;
		ramp.Visible = false;

		const states = player.popStates();
		const state = states.getState<RampState>('ramp');

		expect(state.heightBottom).to.equal(6);
		expect(state.heightTop).to.equal(54);
		expect(state.widthBottom).to.equal(89);
		expect(state.widthTop).to.equal(32);
		expect(state.material).to.equal('mat2');
		expect(state.type).to.equal(Enums.RampType.RampType1Wire);
		expect(state.textureAlignment).to.equal(Enums.ImageAlignment.ImageAlignTopLeft);
		expect(state.hasWallImage).to.equal(false);
		expect(state.leftWallHeight).to.equal(3);
		expect(state.rightWallHeight).to.equal(5);
		expect(state.leftWallHeightVisible).to.equal(3);
		expect(state.rightWallHeightVisible).to.equal(6);
		expect(state.depthBias).to.equal(3);
		expect(state.isVisible).to.equal(false);
	});

	it('should not crash when executing unused APIs', () => {
		const table = new TableBuilder()
			.addMaterial('mat')
			.addRamp('ramp')
			.build();
		new Player(table).init();
		const ramp = table.ramps.ramp.getApi();
		expect(ramp.InterfaceSupportsErrorInfo({})).to.equal(false);
	});

});
