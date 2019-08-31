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

import sinonChai = require('sinon-chai');
import { Player } from '../../game/player';

chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball primitive API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-primitive.vpx')));
		player = new Player(table);
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
		primitive.RotAndTra0 = 11.235; expect(primitive.RotAndTra0).to.equal(11.235); expect(primitive.RotX).to.equal(11.235);
		primitive.RotAndTra1 = 73.244; expect(primitive.RotAndTra1).to.equal(73.244); expect(primitive.RotY).to.equal(73.244);
		primitive.RotAndTra2 = 54.954; expect(primitive.RotAndTra2).to.equal(54.954); expect(primitive.RotZ).to.equal(54.954);
		primitive.RotAndTra3 = 57.763; expect(primitive.RotAndTra3).to.equal(57.763); expect(primitive.TransX).to.equal(57.763);
		primitive.RotAndTra4 = 34.166; expect(primitive.RotAndTra4).to.equal(34.166); expect(primitive.TransY).to.equal(34.166);
		primitive.RotAndTra5 = 97.438; expect(primitive.RotAndTra5).to.equal(97.438); expect(primitive.TransZ).to.equal(97.438);
		primitive.RotAndTra6 = 17.856; expect(primitive.RotAndTra6).to.equal(17.856); expect(primitive.ObjRotX).to.equal(17.856);
		primitive.RotAndTra7 = 75.278; expect(primitive.RotAndTra7).to.equal(75.278); expect(primitive.ObjRotY).to.equal(75.278);
		primitive.RotAndTra8 = 44.237; expect(primitive.RotAndTra8).to.equal(44.237); expect(primitive.ObjRotZ).to.equal(44.237);
		primitive.RotX = 111.235; expect(primitive.RotAndTra0).to.equal(111.235); expect(primitive.RotX).to.equal(111.235);
		primitive.RotY = 731.244; expect(primitive.RotAndTra1).to.equal(731.244); expect(primitive.RotY).to.equal(731.244);
		primitive.RotZ = 541.954; expect(primitive.RotAndTra2).to.equal(541.954); expect(primitive.RotZ).to.equal(541.954);
		primitive.TransX = 571.763; expect(primitive.RotAndTra3).to.equal(571.763); expect(primitive.TransX).to.equal(571.763);
		primitive.TransY = 341.166; expect(primitive.RotAndTra4).to.equal(341.166); expect(primitive.TransY).to.equal(341.166);
		primitive.TransZ = 971.438; expect(primitive.RotAndTra5).to.equal(971.438); expect(primitive.TransZ).to.equal(971.438);
		primitive.ObjRotX = 171.856; expect(primitive.RotAndTra6).to.equal(171.856); expect(primitive.ObjRotX).to.equal(171.856);
		primitive.ObjRotY = 751.278; expect(primitive.RotAndTra7).to.equal(751.278); expect(primitive.ObjRotY).to.equal(751.278);
		primitive.ObjRotZ = 441.237; expect(primitive.RotAndTra8).to.equal(441.237); expect(primitive.ObjRotZ).to.equal(441.237);
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
