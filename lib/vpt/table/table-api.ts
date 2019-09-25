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

import { EventProxy } from '../../game/event-proxy';
import { Player } from '../../game/player';
import { VP_VERSION_MAJOR, VP_VERSION_MINOR, VP_VERSION_REV } from '../../index';
import { clamp } from '../../math/functions';
import {
	DEFAULT_TABLE_GRAVITY,
	DEFAULT_TABLE_MAX_SLOPE,
	DEFAULT_TABLE_MIN_SLOPE,
	GRAVITYCONST,
} from '../../physics/constants';
import { ItemApi } from '../item-api';
import { Table } from './table';
import { TableData } from './table-data';

export class TableApi extends ItemApi<TableData> {

	private readonly global3DMaxSeparation = 0.3;
	private readonly global3DZPD = 0.5;
	private readonly global3DOffset = 0.0;
	private readonly globalDetailLevel = 10;
	private readonly overrideMinSlope = DEFAULT_TABLE_MIN_SLOPE;
	private readonly overrideMaxSlope = DEFAULT_TABLE_MAX_SLOPE;
	private readonly overrideGravityConstant = DEFAULT_TABLE_GRAVITY;

	private currentBackglassMode: number;

	constructor(data: TableData, events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
		this.currentBackglassMode = data.bgCurrentSet;
	}

	get FileName() { return this.data.getName(); }
	get MaxSeparation() { return this.data.overwriteGlobalStereo3D ? this.data._3DmaxSeparation : this.global3DMaxSeparation; }
	set MaxSeparation(v) { if (this.data.overwriteGlobalStereo3D) { this.data._3DmaxSeparation = v; } }
	get ZPD() { return this.data.overwriteGlobalStereo3D ? this.data._3DZPD : this.global3DZPD; }
	set ZPD(v) { if (this.data.overwriteGlobalStereo3D) { this.data._3DZPD = v; } }
	get Offset() { return this.data.overwriteGlobalStereo3D ? this.data._3DOffset : this.global3DOffset; }
	set Offset(v) { if (this.data.overwriteGlobalStereo3D) { this.data._3DOffset = v; } }
	get Image() { return this.data.szImage; }
	set Image(v) { this._assertNonHdrImage(v); this.data.szImage = v; }
	get DisplayGrid() { return this.data.showGrid; }
	set DisplayGrid(v) { this.data.showGrid = v; }
	get DisplayBackdrop() { return this.data.displayBackdrop; }
	set DisplayBackdrop(v) { this.data.displayBackdrop = v; }
	get GlassHeight() { return this.data.glassHeight; }
	set GlassHeight(v) { this.data.glassHeight = v; }
	get TableHeight() { return this.data.tableHeight; }
	set TableHeight(v) { this.data.tableHeight = v; }
	get Width() { return this.data.right - this.data.left; }
	set Width(v) { this.data.right = v; }
	get Height() { return this.data.bottom - this.data.top; }
	set Height(v) { this.data.bottom = v; }
	get PlayfieldMaterial() { return this.data.szPlayfieldMaterial; }
	set PlayfieldMaterial(v) { this.data.szPlayfieldMaterial = v; }
	get LightAmbient() { return this.data.lightAmbient; }
	set LightAmbient(v) { this.data.lightAmbient = v; }
	get Light0Emission() { return 1; } // TODO https://github.com/vpdb/vpx-js/issues/75
	set Light0Emission(v) { /* TODO https://github.com/vpdb/vpx-js/issues/75 */}
	get LightHeight() { return this.data.lightHeight; }
	set LightHeight(v) { this.data.lightHeight = v; }
	get LightRange() { return this.data.lightRange; }
	set LightRange(v) { this.data.lightRange = v; }
	get LightEmissionScale() { return this.data.lightEmissionScale; }
	set LightEmissionScale(v) { this.data.lightEmissionScale = v; }
	get NightDay() { return quantizeUnsignedPercent(this.data.globalEmissionScale!); }
	set NightDay(v) { this.data.globalEmissionScale = dequantizeUnsignedPercent(v); }
	get AOScale() { return this.data.aoScale; }
	set AOScale(v) { this.data.aoScale = v; }
	get SSRScale() { return this.data.ssrScale; }
	set SSRScale(v) { this.data.ssrScale = v; }
	get EnvironmentEmissionScale() { return this.data.envEmissionScale; }
	set EnvironmentEmissionScale(v) { this.data.envEmissionScale = v; }
	get BallReflection() { return this.data.useReflectionForBalls; }
	set BallReflection(v) { this.data.useReflectionForBalls = v; }
	get PlayfieldReflectionStrength() { return quantizeUnsignedPercent(this.data.playfieldReflectionStrength); }
	set PlayfieldReflectionStrength(v) { this.data.playfieldReflectionStrength = dequantizeUnsignedPercent(v); }
	get BallTrail() { return this.data.useTrailForBalls; }
	set BallTrail(v) { this.data.useTrailForBalls = v; }
	get TrailStrength() { return quantizeUnsignedPercent(this.data.ballTrailStrength); }
	set TrailStrength(v) { this.data.ballTrailStrength = dequantizeUnsignedPercent(v); }
	get BallPlayfieldReflectionScale() { return this.data.ballPlayfieldReflectionStrength; }
	set BallPlayfieldReflectionScale(v) { this.data.ballPlayfieldReflectionStrength = v; }
	get DefaultBulbIntensityScale() { return this.data.defaultBulbIntensityScaleOnBall; }
	set DefaultBulbIntensityScale(v) { this.data.defaultBulbIntensityScaleOnBall = v; }
	get BloomStrength() { return this.data.bloomStrength; }
	set BloomStrength(v) { this.data.bloomStrength = v; }
	get TableSoundVolume() { return quantizeUnsignedPercent(this.data.tableSoundVolume); }
	set TableSoundVolume(v) { this.data.tableSoundVolume = dequantizeUnsignedPercent(v); }
	get DetailLevel() { return this.data.overwriteGlobalDetailLevel ? this.data.userDetailLevel : this.globalDetailLevel; }
	set DetailLevel(v) { if (this.data.overwriteGlobalDetailLevel) { this.data.userDetailLevel = v; } }
	get GlobalAlphaAcc() { return this.data.overwriteGlobalDetailLevel; }
	set GlobalAlphaAcc(v) {
		this.data.overwriteGlobalDetailLevel = v;
		if (!this.data.overwriteGlobalDetailLevel) {
			this.data.userDetailLevel = this.globalDetailLevel;
		}
	}
	get GlobalDayNight() { return this.data.overwriteGlobalDayNight; }
	set GlobalDayNight(v) { this.data.overwriteGlobalDayNight = v; }
	get GlobalStereo3D() { return this.data.overwriteGlobalStereo3D; }
	set GlobalStereo3D(v) {
		this.data.overwriteGlobalStereo3D = v;
		if (!this.data.overwriteGlobalStereo3D) {
			this.data._3DmaxSeparation = this.global3DMaxSeparation;
			this.data._3DZPD = this.global3DZPD;
			this.data._3DOffset = this.global3DOffset;
			this.data.userDetailLevel = this.globalDetailLevel;
		}
	}
	get BallDecalMode() { return this.data.ballDecalMode; }
	set BallDecalMode(v) { this.data.ballDecalMode = v; }
	get TableMusicVolume() { return quantizeUnsignedPercent(this.data.tableMusicVolume); }
	set TableMusicVolume(v) { this.data.tableMusicVolume = dequantizeUnsignedPercent(v); }
	get TableAdaptiveVSync() { return this.data.tableAdaptiveVSync; }
	set TableAdaptiveVSync(v) { this.data.tableAdaptiveVSync = v; }
	get BackdropColor() { return this.data.colorBackdrop; }
	set BackdropColor(v) { this.data.colorBackdrop = v; }
	get BackdropImageApplyNightDay() { return this.data.imageBackdropNightDay; }
	set BackdropImageApplyNightDay(v) { this.data.imageBackdropNightDay = v; }
	get ShowFSS() { return this.data.bgEnableFss; }
	set ShowFSS(v) { this.data.bgEnableFss = v; }
	get BackdropImage_DT() { return this.data.bgImage[TableData.BG_DESKTOP]; }
	set BackdropImage_DT(v) { this.data.bgImage[TableData.BG_DESKTOP] = v; }
	get BackdropImage_FS() { return this.data.bgImage[TableData.BG_FULLSCREEN]; }
	set BackdropImage_FS(v) { this.data.bgImage[TableData.BG_FULLSCREEN] = v; }
	get BackdropImage_FSS() { return this.data.bgImage[TableData.BG_FSS]; }
	set BackdropImage_FSS(v) { this.data.bgImage[TableData.BG_FSS] = v; }
	get ColorGradeImage() { return this.data.szImageColorGrade; }
	set ColorGradeImage(v) {
		const tex = this.table.getTexture(v);
		if (tex && (tex.width !== 256 || tex.height !== 16)) {
			throw new Error('Wrong image size, needs to be 256x16 resolution');
		}
		this.data.szImageColorGrade = v;
	}
	get Gravity() { return this.data.gravity / GRAVITYCONST; }
	set Gravity(v) {
		this.data.gravity = v * GRAVITYCONST;
		const minSlope = (this.data.overridePhysics ? this.overrideMinSlope : this.data.angletiltMin);
		const maxSlope = (this.data.overridePhysics ? this.overrideMaxSlope : this.data.angleTiltMax);
		const slope = minSlope + (maxSlope - minSlope) * this.data.globalDifficulty;
		this.player.setGravity(slope, this.data.overridePhysics ? this.overrideGravityConstant : this.data.gravity);
	}
	get Friction() { return this.data.friction; }
	set Friction(v) { this.data.friction = clamp(v, 0, 1); }
	get Elasticity() { return this.data.elasticity; }
	set Elasticity(v) { this.data.elasticity = v; }
	get ElasticityFalloff() { return this.data.elasticityFalloff; }
	set ElasticityFalloff(v) { this.data.elasticityFalloff = v; }
	get Scatter() { return this.data.scatter; }
	set Scatter(v) { this.data.scatter = v; }
	get DefaultScatter() { return this.data.defaultScatter; }
	set DefaultScatter(v) { this.data.defaultScatter = v; }
	get NudgeTime() { return this.data.nudgeTime; }
	set NudgeTime(v) { this.data.nudgeTime = v; }
	get PlungerNormalize() { return this.data.plungerNormalize; }
	set PlungerNormalize(v) { this.data.plungerNormalize = v; }
	get PlungerFilter() { return this.data.plungerFilter; }
	set PlungerFilter(v) { this.data.plungerFilter = v; }
	get PhysicsLoopTime() { return this.data.physicsMaxLoops; }
	set PhysicsLoopTime(v) { this.data.physicsMaxLoops = v; }
	get BackglassMode() { return this.currentBackglassMode + TableData.BGI_DESKTOP; }
	set BackglassMode(v) { this.currentBackglassMode = v - TableData.BGI_DESKTOP; }
	get FieldOfView() { return this.data.bgFov[this.currentBackglassMode]; }
	set FieldOfView(v) { this.data.bgFov[this.currentBackglassMode] = v; }
	get Inclination() { return this.data.bgInclination[this.currentBackglassMode]; }
	set Inclination(v) { this.data.bgInclination[this.currentBackglassMode] = v; }
	get Layback() { return this.data.bgLayback[this.currentBackglassMode]; }
	set Layback(v) { this.data.bgLayback[this.currentBackglassMode] = v; }
	get Rotation() { return this.data.bgRotation[this.currentBackglassMode]; }
	set Rotation(v) { this.data.bgRotation[this.currentBackglassMode] = v; }
	get Scalex() { return this.data.bgScaleX[this.currentBackglassMode]; }
	set Scalex(v) { this.data.bgScaleX[this.currentBackglassMode] = v; }
	get Scaley() { return this.data.bgScaleY[this.currentBackglassMode]; }
	set Scaley(v) { this.data.bgScaleY[this.currentBackglassMode] = v; }
	get Scalez() { return this.data.bgScaleZ[this.currentBackglassMode]; }
	set Scalez(v) { this.data.bgScaleZ[this.currentBackglassMode] = v; }
	get Xlatex() { return this.data.bgXlateX[this.currentBackglassMode]; }
	set Xlatex(v) { this.data.bgXlateX[this.currentBackglassMode] = v; }
	get Xlatey() { return this.data.bgXlateY[this.currentBackglassMode]; }
	set Xlatey(v) { this.data.bgXlateY[this.currentBackglassMode] = v; }
	get Xlatez() { return this.data.bgXlateZ[this.currentBackglassMode]; }
	set Xlatez(v) { this.data.bgXlateZ[this.currentBackglassMode] = v; }
	get SlopeMax() { return this.data.angleTiltMax; }
	set SlopeMax(v) {
		this.data.angleTiltMax = v;
		const slope = this.data.angletiltMin + (this.data.angleTiltMax - this.data.angletiltMin) * this.data.globalDifficulty;
		this.player.setGravity(slope, this.data.overridePhysics ? this.overrideGravityConstant : this.data.gravity);
	}
	get SlopeMin() { return this.data.angletiltMin; }
	set SlopeMin(v) {
		this.data.angletiltMin = v;
		const slope = this.data.angletiltMin + (this.data.angleTiltMax - this.data.angletiltMin) * this.data.globalDifficulty;
		this.player.setGravity(slope, this.data.overridePhysics ? this.overrideGravityConstant : this.data.gravity);
	}
	get BallImage() { return this.data.szBallImage; }
	set BallImage(v) { this.data.szBallImage = v; }
	get EnvironmentImage() { return this.data.szEnvImage; }
	set EnvironmentImage(v) {
		const tex = this.table.getTexture(v);
		if (tex && (tex.width !== tex.height * 2)) {
			throw new Error('Wrong image size, needs to be 2x width in comparison to height');
		}
		this.data.szEnvImage = v;
	}
	get YieldTime(): any { throw new Error('Not supported in play.'); }
	set YieldTime(v: any) { throw new Error('Not supported in play.'); }
	get EnableAntialiasing() { return this.data.useAA; }
	set EnableAntialiasing(v) { this.data.useAA = v; }
	get EnableSSR() { return this.data.useSSR; }
	set EnableSSR(v) { this.data.useSSR = v; }
	get EnableAO() { return this.data.useAO; }
	set EnableAO(v) { this.data.useAO = v; }
	get EnableFXAA() { return this.data.useFXAA; }
	set EnableFXAA(v) { this.data.useFXAA = v; }
	get OverridePhysics() { return this.data.overridePhysics; }
	set OverridePhysics(v) { this.data.overridePhysics = v; }
	get OverridePhysicsFlippers() { return this.data.overridePhysicsFlipper; }
	set OverridePhysicsFlippers(v) { this.data.overridePhysicsFlipper = v; }
	get EnableDecals() { return this.data.renderDecals; }
	set EnableDecals(v) { this.data.renderDecals = v; }
	get ShowDT() { return this.data.bgCurrentSet === TableData.BG_DESKTOP || this.data.bgCurrentSet === TableData.BG_FSS; }
	set ShowDT(v) { this.data.bgCurrentSet = v ? (this.data.bgEnableFss ? TableData.BG_FSS : TableData.BG_DESKTOP) : TableData.BG_FULLSCREEN; }
	get ReflectElementsOnPlayfield() { return this.data.reflectElementsOnPlayfield; }
	set ReflectElementsOnPlayfield(v) { this.data.reflectElementsOnPlayfield = v; }
	get EnableEMReels() { return this.data.renderEMReels; }
	set EnableEMReels(v) { this.data.renderEMReels = v; }
	get GlobalDifficulty() { return this.data.globalDifficulty * 100; }
	set GlobalDifficulty(v) { this.data.globalDifficulty = clamp(v, 0, 100) / 100.0; }
	get Accelerometer() { return false; }
	set Accelerometer(v) { /* do nothing, we don't have accelerometers on the web. */ }
	get AccelNormalMount() { return false; }
	set AccelNormalMount(v) {  /* do nothing, we don't have accelerometers on the web. */ }
	get AccelerometerAngle() { return 0.0; }
	set AccelerometerAngle(v) { /* do nothing, we don't have accelerometers on the web. */ }
	get DeadZone() { return 0; }
	set DeadZone(v) { /* do nothing, we don't have accelerometers on the web. */ }
	get BallFrontDecal() { return this.data.szBallImageFront; }
	set BallFrontDecal(v) { this._assertNonHdrImage(v); this.data.szBallImageFront = v; }
	get Version() { return VP_VERSION_MAJOR * 1000 + VP_VERSION_MINOR * 100 + VP_VERSION_REV; }
	get VPBuildVersion() { return VP_VERSION_MAJOR * 1000 + VP_VERSION_MINOR * 100 + VP_VERSION_REV; }
	get VersionMajor() { return VP_VERSION_MAJOR; }
	get VersionMinor() { return VP_VERSION_MINOR; }
	get VersionRevision() { return VP_VERSION_REV; }

	public PlaySound(bstr: string, loopcount: number, volume: number, pan: number, randompitch: number, pitch: number, usesame: boolean, restart: boolean, front_rear_fade: number) {
		// to implement
	}

	public GetPredefinedStrings(dispID: number): any {
		// to implement
	}

	public GetPredefinedValue(dispID: number): any {
		// to implement
	}

	public ImportPhysics(): void {
		// to implement, or probably not.
	}

	public ExportPhysics(): void {
		// to implement, or probably not.
	}

	public FireKnocker(count: number): void {
		// to implement
	}

	public QuitPlayer(closeType: number): void {
		// to implement
	}
}

function dequantizeUnsignedPercent(i: number) {
	/* originally:
	 *
	 * enum { N = 100 };
	 * return precise_divide((float)i, (float)N);
	 */
	return Math.min(i / 100, 1);
}

function quantizeUnsignedPercent(x: number) {
	/* originally:
	 *
	 * enum { N = 100, Np1 = 101 };
	 * assert(x >= 0.f);
	 * return min((unsigned int)(x * (float)Np1), (unsigned int)N);
	 */
	return Math.min(Math.max(0, x) * 100, 100);
}
