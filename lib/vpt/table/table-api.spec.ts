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
import * as sinonChai from 'sinon-chai';
import { ThreeHelper } from '../../../test/three.helper';
import { Player } from '../../game/player';
import { NodeBinaryReader } from '../../io/binary-reader.node';
import { Table } from '../table/table';

/* tslint:disable:no-unused-expression */
chai.use(sinonChai);
const three = new ThreeHelper();

describe('The VPinball table API', () => {

	let table: Table;
	let player: Player;

	beforeEach(async () => {
		table = await Table.load(new NodeBinaryReader(three.fixturePath('table-texture.vpx')));
		player = new Player(table).init();
	});

	it('should correctly read and write the properties', async () => {
		const api = table.getApi();

		expect(api.FileName).to.equal(api.Name);

		api.GlobalStereo3D = false; expect(api.GlobalStereo3D).to.equal(false);
		api.MaxSeparation = 23; expect(api.MaxSeparation).to.equal(0.3);
		api.ZPD = 23; expect(api.ZPD).to.equal(0.5);
		api.Offset = 23; expect(api.Offset).to.equal(0.0);

		api.GlobalStereo3D = true; expect(api.GlobalStereo3D).to.equal(true);
		api.MaxSeparation = 1243; expect(api.MaxSeparation).to.equal(1243);
		api.ZPD = 0.55; expect(api.ZPD).to.equal(0.55);
		api.Offset = 1.6; expect(api.Offset).to.equal(1.6);

		api.Image = 'test_pattern_png'; expect(api.Image).to.equal('test_pattern_png');
		api.DisplayGrid = true; expect(api.DisplayGrid).to.equal(true);
		api.DisplayGrid = false; expect(api.DisplayGrid).to.equal(false);
		api.DisplayBackdrop = true; expect(api.DisplayBackdrop).to.equal(true);
		api.DisplayBackdrop = false; expect(api.DisplayBackdrop).to.equal(false);
		api.GlassHeight = 55.6; expect(api.GlassHeight).to.equal(55.6);
		api.TableHeight = 98.1; expect(api.TableHeight).to.equal(98.1);
		api.Width = 580; expect(api.Width).to.equal(580);
		api.Height = 1500; expect(api.Height).to.equal(1500);
		api.PlayfieldMaterial = 'pfmat'; expect(api.PlayfieldMaterial).to.equal('pfmat');
		api.LightAmbient = 3.2; expect(api.LightAmbient).to.equal(3.2);
		api.LightHeight = 995; expect(api.LightHeight).to.equal(995);
		api.LightRange = 5.4; expect(api.LightRange).to.equal(5.4);
		api.LightEmissionScale = 0.8; expect(api.LightEmissionScale).to.equal(0.8);
		api.NightDay = 80; expect(api.NightDay).to.equal(80);
		api.NightDay = 200; expect(api.NightDay).to.equal(100);
		api.NightDay = -10; expect(api.NightDay).to.equal(0);
		api.AOScale = 1.8; expect(api.AOScale).to.equal(1.8);
		api.SSRScale = 1.6; expect(api.SSRScale).to.equal(1.6);
		api.EnvironmentEmissionScale = 0.2; expect(api.EnvironmentEmissionScale).to.equal(0.2);
		api.BallReflection = 4; expect(api.BallReflection).to.equal(4);
		api.PlayfieldReflectionStrength = 41; expect(api.PlayfieldReflectionStrength).to.equal(41);
		api.BallTrail = 1.5; expect(api.BallTrail).to.equal(1.5);
		api.TrailStrength = 89; expect(api.TrailStrength).to.equal(89);
		api.BallPlayfieldReflectionScale = 5.12; expect(api.BallPlayfieldReflectionScale).to.equal(5.12);
		api.DefaultBulbIntensityScale = 2314; expect(api.DefaultBulbIntensityScale).to.equal(2314);
		api.BloomStrength = 13; expect(api.BloomStrength).to.equal(13);
		api.TableSoundVolume = 10; expect(api.TableSoundVolume).to.equal(10);

		api.GlobalAlphaAcc = true; expect(api.GlobalAlphaAcc).to.equal(true);
		api.DetailLevel = 2; expect(api.DetailLevel).to.equal(2);
		api.GlobalAlphaAcc = false; expect(api.DetailLevel).to.equal(10);
		api.DetailLevel = 11; expect(api.DetailLevel).to.equal(10);

		api.GlobalDayNight = false; expect(api.GlobalDayNight).to.equal(false);
		api.GlobalDayNight = true; expect(api.GlobalDayNight).to.equal(true);
		api.BallDecalMode = false; expect(api.BallDecalMode).to.equal(false);
		api.BallDecalMode = true; expect(api.BallDecalMode).to.equal(true);
		api.TableMusicVolume = 16; expect(api.TableMusicVolume).to.equal(16);
		api.TableAdaptiveVSync = 2314; expect(api.TableAdaptiveVSync).to.equal(2314);
		api.BackdropColor = 0x4f9a29; expect(api.BackdropColor).to.equal(0x4f9a29);
		api.BackdropImageApplyNightDay = false; expect(api.BackdropImageApplyNightDay).to.equal(false);
		api.BackdropImageApplyNightDay = true; expect(api.BackdropImageApplyNightDay).to.equal(true);
		api.ShowFSS = true; expect(api.ShowFSS).to.equal(true);
		api.ShowFSS = false; expect(api.ShowFSS).to.equal(false);
		api.BackdropImage_DT = 'bgdt'; expect(api.BackdropImage_DT).to.equal('bgdt');
		api.BackdropImage_FS = 'bgfs'; expect(api.BackdropImage_FS).to.equal('bgfs');
		api.BackdropImage_FSS = 'bgfss'; expect(api.BackdropImage_FSS).to.equal('bgfss');
		expect(() => api.ColorGradeImage = 'test_pattern_jpg').to.throw('Wrong image size, needs to be 256x16 resolution');
		api.Gravity = 1; expect(api.Gravity).to.equal(1);
		api.Friction = 0.6; expect(api.Friction).to.equal(0.6);
		api.Friction = -1; expect(api.Friction).to.equal(0);
		api.Friction = 23; expect(api.Friction).to.equal(1);
		api.Elasticity = 85.6; expect(api.Elasticity).to.equal(85.6);
		api.ElasticityFalloff = 65; expect(api.ElasticityFalloff).to.equal(65);
		api.Scatter = 22.65; expect(api.Scatter).to.equal(22.65);
		api.DefaultScatter = 2; expect(api.DefaultScatter).to.equal(2);
		api.NudgeTime = 0.22; expect(api.NudgeTime).to.equal(0.22);
		api.PlungerNormalize = 98165; expect(api.PlungerNormalize).to.equal(98165);
		api.PlungerFilter = false; expect(api.PlungerFilter).to.equal(false);
		api.PlungerFilter = true; expect(api.PlungerFilter).to.equal(true);
		api.PhysicsLoopTime = 120; expect(api.PhysicsLoopTime).to.equal(120);

		api.BackglassMode = 2; expect(api.BackglassMode).to.equal(2);
		api.FieldOfView = 35; expect(api.FieldOfView).to.equal(35);
		api.Inclination = 21; expect(api.Inclination).to.equal(21);
		api.Layback = 59; expect(api.Layback).to.equal(59);
		api.Rotation = 59; expect(api.Rotation).to.equal(59);
		api.Scalex = 5; expect(api.Scalex).to.equal(5);
		api.Scaley = 6; expect(api.Scaley).to.equal(6);
		api.Scalez = 7; expect(api.Scalez).to.equal(7);
		api.Xlatex = 8; expect(api.Xlatex).to.equal(8);
		api.Xlatey = 9; expect(api.Xlatey).to.equal(9);
		api.Xlatez = 4; expect(api.Xlatez).to.equal(4);

		api.BackglassMode = 1;
		api.FieldOfView = 135; expect(api.FieldOfView).to.equal(135);
		api.Inclination = 121; expect(api.Inclination).to.equal(121);
		api.Layback = 159; expect(api.Layback).to.equal(159);
		api.Rotation = 159; expect(api.Rotation).to.equal(159);
		api.Scalex = 15; expect(api.Scalex).to.equal(15);
		api.Scaley = 16; expect(api.Scaley).to.equal(16);
		api.Scalez = 17; expect(api.Scalez).to.equal(17);
		api.Xlatex = 18; expect(api.Xlatex).to.equal(18);
		api.Xlatey = 19; expect(api.Xlatey).to.equal(19);
		api.Xlatez = 14; expect(api.Xlatez).to.equal(14);

		api.BackglassMode = 2;
		expect(api.FieldOfView).to.equal(35);
		expect(api.Inclination).to.equal(21);
		expect(api.Layback).to.equal(59);
		expect(api.Rotation).to.equal(59);
		expect(api.Scalex).to.equal(5);
		expect(api.Scaley).to.equal(6);
		expect(api.Scalez).to.equal(7);
		expect(api.Xlatex).to.equal(8);
		expect(api.Xlatey).to.equal(9);
		expect(api.Xlatez).to.equal(4);

		api.SlopeMax = 0.2; expect(api.SlopeMax).to.equal(0.2);
		api.SlopeMin = 0.1; expect(api.SlopeMin).to.equal(0.1);
		api.BallImage = 'ballimg'; expect(api.BallImage).to.equal('ballimg');
		api.EnvironmentImage = 'test_pattern_hdr'; expect(api.EnvironmentImage).to.equal('test_pattern_hdr');
		expect(() => api.EnvironmentImage = 'test_pattern_jpg').to.throw('Wrong image size, needs to be 2x width in comparison to height');
		expect(() => api.YieldTime = 10).to.throw('Not supported in play.');
		expect(() => api.YieldTime).to.throw('Not supported in play.');
		api.EnableAntialiasing = 1.335; expect(api.EnableAntialiasing).to.equal(1.335);
		api.EnableSSR = 12312; expect(api.EnableSSR).to.equal(12312);
		api.EnableAO = 51; expect(api.EnableAO).to.equal(51);
		api.EnableFXAA = 521; expect(api.EnableFXAA).to.equal(521);
		api.OverridePhysics = 2; expect(api.OverridePhysics).to.equal(2);
		api.OverridePhysicsFlippers = false; expect(api.OverridePhysicsFlippers).to.equal(false);
		api.OverridePhysicsFlippers = true; expect(api.OverridePhysicsFlippers).to.equal(true);
		api.EnableDecals = false; expect(api.EnableDecals).to.equal(false);
		api.EnableDecals = true; expect(api.EnableDecals).to.equal(true);
		api.ShowDT = false; expect(api.ShowDT).to.equal(false);
		api.ShowDT = true; expect(api.ShowDT).to.equal(true);
		api.ReflectElementsOnPlayfield = false; expect(api.ReflectElementsOnPlayfield).to.equal(false);
		api.ReflectElementsOnPlayfield = true; expect(api.ReflectElementsOnPlayfield).to.equal(true);
		api.EnableEMReels = false; expect(api.EnableEMReels).to.equal(false);
		api.EnableEMReels = true; expect(api.EnableEMReels).to.equal(true);
		api.GlobalDifficulty = 50; expect(api.GlobalDifficulty).to.equal(50);
		api.GlobalDifficulty = 200; expect(api.GlobalDifficulty).to.equal(100);
		api.GlobalDifficulty = -10; expect(api.GlobalDifficulty).to.equal(0);
		api.Accelerometer = true; expect(api.Accelerometer).to.equal(false); // no acc/ support
		api.AccelNormalMount = true; expect(api.AccelNormalMount).to.equal(false); // no acc/ support
		api.AccelerometerAngle = 1; expect(api.AccelerometerAngle).to.equal(0.0); // no acc/ support
		api.DeadZone = 1; expect(api.DeadZone).to.equal(0); // no acc/ support
		api.BallFrontDecal = 'test_pattern_xrgb'; expect(api.BallFrontDecal).to.equal('test_pattern_xrgb');
		expect(api.Version).to.equal(10600);
		expect(api.VPBuildVersion).to.equal(10600);
		expect(api.VersionMajor).to.equal(10);
		expect(api.VersionMinor).to.equal(6);
		expect(api.VersionRevision).to.equal(0);
	});

	it('should not crash when executing unused APIs', () => {
		const api = table.getApi();
		api.ImportPhysics();
		api.ExportPhysics();
		api.FireKnocker(1);
	});

});
