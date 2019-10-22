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

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball primitive API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-primitive.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const primitive = table.primitives.Cube.getApi();

		primitive.Image = 'p1-beachwood'; expect(primitive.Image).to.equal('p1-beachwood');
		primitive.NormalMap = 'p1-beachwood'; expect(primitive.NormalMap).to.equal('p1-beachwood');
		primitive.Material = 'mathoos'; expect(primitive.Material).to.equal('mathoos');
		primitive.MeshFileName = 'meshiemeshie'; expect(primitive.MeshFileName).to.equal('meshiemeshie');
		primitive.Sides = 6; expect(primitive.Sides).to.equal(6);
		primitive.SideColor = 0x6a90ac; expect(primitive.SideColor).to.equal(0x6a90ac);
		primitive.Visible = false; expect(primitive.Visible).to.equal(false);
		primitive.Visible = true; expect(primitive.Visible).to.equal(true);
		primitive.DrawTexturesInside = false; expect(primitive.DrawTexturesInside).to.equal(false);
		primitive.DrawTexturesInside = true; expect(primitive.DrawTexturesInside).to.equal(true);
		primitive.X = 115; expect(primitive.X).to.equal(115);
		primitive.Y = 23451; expect(primitive.Y).to.equal(23451);
		primitive.Z = 43567; expect(primitive.Z).to.equal(43567);
		primitive.Size_X = 44311; expect(primitive.Size_X).to.equal(44311);
		primitive.Size_Y = 67362; expect(primitive.Size_Y).to.equal(67362);
		primitive.Size_Z = 95603; expect(primitive.Size_Z).to.equal(95603);
		primitive.RotAndTra0 = 11.235; expect(primitive.RotAndTra0).to.be.closeTo(11.2350, 0.0001); expect(primitive.RotX).to.be.closeTo(11.235, 0.0001);
		primitive.RotAndTra1 = 73.244; expect(primitive.RotAndTra1).to.be.closeTo(73.244, 0.0001); expect(primitive.RotY).to.be.closeTo(73.244, 0.0001);
		primitive.RotAndTra2 = 54.954; expect(primitive.RotAndTra2).to.be.closeTo(54.954, 0.0001); expect(primitive.RotZ).to.be.closeTo(54.954, 0.0001);
		primitive.RotAndTra3 = 57.763; expect(primitive.RotAndTra3).to.be.closeTo(57.763, 0.0001); expect(primitive.TransX).to.be.closeTo(57.763, 0.0001);
		primitive.RotAndTra4 = 34.166; expect(primitive.RotAndTra4).to.be.closeTo(34.166, 0.0001); expect(primitive.TransY).to.be.closeTo(34.166, 0.0001);
		primitive.RotAndTra5 = 97.438; expect(primitive.RotAndTra5).to.be.closeTo(97.438, 0.0001); expect(primitive.TransZ).to.be.closeTo(97.438, 0.0001);
		primitive.RotAndTra6 = 17.856; expect(primitive.RotAndTra6).to.be.closeTo(17.856, 0.0001); expect(primitive.ObjRotX).to.be.closeTo(17.856, 0.0001);
		primitive.RotAndTra7 = 75.278; expect(primitive.RotAndTra7).to.be.closeTo(75.278, 0.0001); expect(primitive.ObjRotY).to.be.closeTo(75.278, 0.0001);
		primitive.RotAndTra8 = 44.237; expect(primitive.RotAndTra8).to.be.closeTo(44.237, 0.0001); expect(primitive.ObjRotZ).to.be.closeTo(44.237, 0.0001);
		primitive.RotX = 111.235; expect(primitive.RotAndTra0).to.be.closeTo(111.235, 0.0001); expect(primitive.RotX).to.be.closeTo(111.235, 0.0001);
		primitive.RotY = 731.244; expect(primitive.RotAndTra1).to.be.closeTo(731.244, 0.0001); expect(primitive.RotY).to.be.closeTo(731.244, 0.0001);
		primitive.RotZ = 541.954; expect(primitive.RotAndTra2).to.be.closeTo(541.954, 0.0001); expect(primitive.RotZ).to.be.closeTo(541.954, 0.0001);
		primitive.TransX = 571.763; expect(primitive.RotAndTra3).to.be.closeTo(571.763, 0.0001); expect(primitive.TransX).to.be.closeTo(571.763, 0.0001);
		primitive.TransY = 341.166; expect(primitive.RotAndTra4).to.be.closeTo(341.166, 0.0001); expect(primitive.TransY).to.be.closeTo(341.166, 0.0001);
		primitive.TransZ = 971.438; expect(primitive.RotAndTra5).to.be.closeTo(971.438, 0.0001); expect(primitive.TransZ).to.be.closeTo(971.438, 0.0001);
		primitive.ObjRotX = 171.856; expect(primitive.RotAndTra6).to.be.closeTo(171.856, 0.0001); expect(primitive.ObjRotX).to.be.closeTo(171.856, 0.0001);
		primitive.ObjRotY = 751.278; expect(primitive.RotAndTra7).to.be.closeTo(751.278, 0.0001); expect(primitive.ObjRotY).to.be.closeTo(751.278, 0.0001);
		primitive.ObjRotZ = 441.237; expect(primitive.RotAndTra8).to.be.closeTo(441.237, 0.0001); expect(primitive.ObjRotZ).to.be.closeTo(441.237, 0.0001);
		primitive.EdgeFactorUI = 23.0982; expect(primitive.EdgeFactorUI).to.equal(23.0982);
		primitive.CollisionReductionFactor = 22.1947; expect(primitive.CollisionReductionFactor).to.equal(22.1947);
		primitive.EnableStaticRendering = false; expect(primitive.EnableStaticRendering).to.equal(false);
		primitive.EnableStaticRendering = true; expect(primitive.EnableStaticRendering).to.equal(true);
		primitive.HasHitEvent = false; expect(primitive.HasHitEvent).to.equal(false);
		primitive.HasHitEvent = true; expect(primitive.HasHitEvent).to.equal(true);
		primitive.Threshold = 32.4918; expect(primitive.Threshold).to.equal(32.4918);
		primitive.Elasticity = 951.62; expect(primitive.Elasticity).to.equal(951.62);
		primitive.ElasticityFalloff = 15.23479; expect(primitive.ElasticityFalloff).to.equal(15.23479);
		primitive.Friction = 68.462; expect(primitive.Friction).to.equal(68.462);
		primitive.Scatter = 22.00937; expect(primitive.Scatter).to.equal(22.00937);
		primitive.Collidable = false; expect(primitive.Collidable).to.equal(false);
		primitive.Collidable = true; expect(primitive.Collidable).to.equal(true);
		primitive.IsToy = false; expect(primitive.IsToy).to.equal(false);
		primitive.IsToy = true; expect(primitive.IsToy).to.equal(true);
		primitive.BackfacesEnabled = false; expect(primitive.BackfacesEnabled).to.equal(false);
		primitive.DisableLighting = true; expect(primitive.DisableLighting).to.equal(true);
		primitive.DisableLighting = false; expect(primitive.DisableLighting).to.equal(false);
		primitive.BlendDisableLighting = 0.998; expect(primitive.BlendDisableLighting).to.equal(0.998);
		primitive.BlendDisableLightingFromBelow = 0.556; expect(primitive.BlendDisableLightingFromBelow).to.equal(0.556);
		primitive.ReflectionEnabled = false; expect(primitive.ReflectionEnabled).to.equal(false);
		primitive.ReflectionEnabled = true; expect(primitive.ReflectionEnabled).to.equal(true);
		primitive.PhysicsMaterial = 'physssmattt'; expect(primitive.PhysicsMaterial).to.equal('physssmattt');
		primitive.OverwritePhysics = false; expect(primitive.OverwritePhysics).to.equal(false);
		primitive.OverwritePhysics = true; expect(primitive.OverwritePhysics).to.equal(true);
		expect(primitive.HitThreshold).to.equal(0);
		primitive.DisplayTexture = false; expect(primitive.DisplayTexture).to.equal(false);
		primitive.DisplayTexture = true; expect(primitive.DisplayTexture).to.equal(true);
		primitive.DepthBias = 5.917852331; expect(primitive.DepthBias).to.equal(5.917852331);

		primitive.Name = 'Boaty McBoatface'; expect(primitive.Name).to.equal('Boaty McBoatface');
		primitive.TimerInterval = 5513; expect(primitive.TimerInterval).to.equal(5513);
		primitive.TimerEnabled = false; expect(primitive.TimerEnabled).to.equal(false);
		primitive.TimerEnabled = true; expect(primitive.TimerEnabled).to.equal(true);
		primitive.UserValue = 'uzzrrrrvaluuuue'; expect(primitive.UserValue).to.equal('uzzrrrrvaluuuue');

	});

});
