/* tslint:disable:variable-name */
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

import { BiffParser } from '../../io/biff-parser';
import { Storage } from '../../io/ole-doc';
import { Vertex2D } from '../../math/vertex2d';
import { Vertex3D } from '../../math/vertex3d';
import { ItemData } from '../item-data';
import { Material, SaveMaterial, SavePhysicsMaterial } from '../material';

/**
 * Global data about the table.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/pintable.cpp
 */
export class TableData extends ItemData {

	public static BG_DESKTOP = 0;
	public static BG_FULLSCREEN = 1;
	public static BG_FSS = 2;

	public static BGI_DESKTOP = 110;
	public static BGI_FULLSCREEN = 111;
	public static BGI_FSS = 112;

	public left!: number;
	public top!: number;
	public right!: number;
	public bottom!: number;
	public bgRotation: number[] = [];
	public bgLayback: number[] = [];
	public bgInclination: number[] = [];
	public bgFov: number[] = [];
	public bgScaleX: number[] = [];
	public bgScaleY: number[] = [];
	public bgScaleZ: number[] = [];
	public bgXlateX: number[] = [];
	public bgXlateY: number[] = [];
	public bgXlateZ: number[] = [];
	public bgEnableFss: boolean = false;
	public bgCurrentSet: number = 0;
	public overridePhysics?: number;
	public overridePhysicsFlipper: boolean = false;
	public gravity!: number;
	public friction!: number;
	public elasticity!: number;
	public elasticityFalloff!: number;
	public scatter!: number;
	public defaultScatter?: number;
	public nudgeTime?: number;
	public plungerNormalize!: number;
	public plungerFilter: boolean = false;
	public physicsMaxLoops: number = 0xFFFFFFFF;
	public renderDecals: boolean = false;
	public renderEMReels: boolean = false;
	public offset: Vertex2D = new Vertex2D();
	public _3DmaxSeparation?: number;
	public _3DZPD?: number;
	public zoom?: number;
	public _3DOffset?: number;
	public overwriteGlobalStereo3D: boolean = false;
	public angleTiltMax!: number;
	public angletiltMin!: number;
	public glassHeight!: number;
	public tableHeight!: number;
	public szImage?: string;
	public szBallImage!: string;
	public szBallImageFront!: string;
	public szScreenShot?: string;
	public displayBackdrop: boolean = false;
	public numGameItems!: number;
	public numSounds!: number;
	public numTextures!: number;
	public numFonts!: number;
	public numCollections!: number;
	public scriptPos!: number;
	public scriptLen!: number;
	public wzName!: string;
	public Light: LightSource[] = [ new LightSource() ];
	public bgImage: string[] = [];
	public imageBackdropNightDay: boolean = false;
	public szImageColorGrade?: string;
	public szEnvImage?: string;
	public szPlayfieldMaterial?: string;
	public lightAmbient?: number;
	public lightHeight?: number;
	public lightRange?: number;
	public lightEmissionScale?: number;
	public envEmissionScale?: number;
	public globalEmissionScale?: number;
	public aoScale?: number;
	public ssrScale?: number;
	public useReflectionForBalls?: number;
	public playfieldReflectionStrength!: number;
	public useTrailForBalls?: number;
	public ballTrailStrength!: number;
	public ballPlayfieldReflectionStrength?: number;
	public defaultBulbIntensityScaleOnBall?: number;
	public useAA?: number;
	public useAO?: number;
	public useSSR?: number;
	public useFXAA?: number;
	public bloomStrength?: number;
	public colorBackdrop?: number;
	public rgcolorcustom?: number[];
	public globalDifficulty!: number;
	public szT?: string;
	public vCustomInfoTag: string[] = [];
	public tableSoundVolume!: number;
	public ballDecalMode?: boolean;
	public tableMusicVolume!: number;
	public tableAdaptiveVSync?: number;
	public overwriteGlobalDetailLevel: boolean = false;
	public overwriteGlobalDayNight: boolean = false;
	public showGrid: boolean = false;
	public reflectElementsOnPlayfield: boolean = false;
	public userDetailLevel?: number;
	public numMaterials!: number;
	public materials: Material[] = [];

	public readonly overrideContactFriction = 0.075;
	public readonly overrideElasticity = 0.25;
	public readonly overrideElasticityFalloff = 0;
	public readonly overrideScatterAngle = 0;

	public static async fromStorage(storage: Storage, itemName: string): Promise<TableData> {
		const tableData = new TableData(itemName);
		await storage.streamFiltered(itemName, 0, BiffParser.stream(tableData.fromTag.bind(tableData), {
			streamedTags: [ 'CODE' ],
		}));
		return tableData;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	public getFriction(): number {
		return this.overridePhysics ? this.overrideContactFriction : this.friction!;
	}

	public getElasticity(): number {
		return this.overridePhysics ? this.overrideElasticity : this.elasticity!;
	}

	public getElasticityFalloff(): number {
		return this.overridePhysics ? this.overrideElasticityFalloff : this.elasticityFalloff!;
	}

	public getScatter(): number {
		return this.overridePhysics ? this.overrideScatterAngle : this.scatter!;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'LEFT': this.left = this.getFloat(buffer); break;
			case 'TOPX': this.top = this.getFloat(buffer); break;
			case 'RGHT': this.right = this.getFloat(buffer); break;
			case 'BOTM': this.bottom = this.getFloat(buffer); break;
			case 'ROTA': this.bgRotation[TableData.BG_DESKTOP] = this.getFloat(buffer); break;
			case 'LAYB': this.bgLayback[TableData.BG_DESKTOP] = this.getFloat(buffer); break;
			case 'INCL': this.bgInclination[TableData.BG_DESKTOP] = this.getFloat(buffer); break;
			case 'FOVX': this.bgFov[TableData.BG_DESKTOP] = this.getFloat(buffer); break;
			case 'SCLX': this.bgScaleX[TableData.BG_DESKTOP] = this.getFloat(buffer); break;
			case 'SCLY': this.bgScaleY[TableData.BG_DESKTOP] = this.getFloat(buffer); break;
			case 'SCLZ': this.bgScaleZ[TableData.BG_DESKTOP] = this.getFloat(buffer); break;
			case 'XLTX': this.bgXlateX[TableData.BG_DESKTOP] = this.getFloat(buffer); break;
			case 'XLTY': this.bgXlateY[TableData.BG_DESKTOP] = this.getFloat(buffer); break;
			case 'XLTZ': this.bgXlateZ[TableData.BG_DESKTOP] = this.getFloat(buffer); break;
			case 'ROTF': this.bgRotation[TableData.BG_FULLSCREEN] = this.getFloat(buffer); break;
			case 'LAYF': this.bgLayback[TableData.BG_FULLSCREEN] = this.getFloat(buffer); break;
			case 'INCF': this.bgInclination[TableData.BG_FULLSCREEN] = this.getFloat(buffer); break;
			case 'FOVF': this.bgFov[TableData.BG_FULLSCREEN] = this.getFloat(buffer); break;
			case 'SCFX': this.bgScaleX[TableData.BG_FULLSCREEN] = this.getFloat(buffer); break;
			case 'SCFY': this.bgScaleY[TableData.BG_FULLSCREEN] = this.getFloat(buffer); break;
			case 'SCFZ': this.bgScaleZ[TableData.BG_FULLSCREEN] = this.getFloat(buffer); break;
			case 'XLFX': this.bgXlateX[TableData.BG_FULLSCREEN] = this.getFloat(buffer); break;
			case 'XLFY': this.bgXlateY[TableData.BG_FULLSCREEN] = this.getFloat(buffer); break;
			case 'XLFZ': this.bgXlateZ[TableData.BG_FULLSCREEN] = this.getFloat(buffer); break;
			case 'ROFS': this.bgRotation[TableData.BG_FSS] = this.getFloat(buffer); break;
			case 'LAFS': this.bgLayback[TableData.BG_FSS] = this.getFloat(buffer); break;
			case 'INFS': this.bgInclination[TableData.BG_FSS] = this.getFloat(buffer); break;
			case 'FOFS': this.bgFov[TableData.BG_FSS] = this.getFloat(buffer); break;
			case 'SCXS': this.bgScaleX[TableData.BG_FSS] = this.getFloat(buffer); break;
			case 'SCYS': this.bgScaleY[TableData.BG_FSS] = this.getFloat(buffer); break;
			case 'SCZS': this.bgScaleZ[TableData.BG_FSS] = this.getFloat(buffer); break;
			case 'XLXS': this.bgXlateX[TableData.BG_FSS] = this.getFloat(buffer); break;
			case 'XLYS': this.bgXlateY[TableData.BG_FSS] = this.getFloat(buffer); break;
			case 'XLZS': this.bgXlateZ[TableData.BG_FSS] = this.getFloat(buffer); break;
			case 'EFSS':
				this.bgEnableFss = this.getBool(buffer);
				/* istanbul ignore if: legacy */
				if (this.bgEnableFss) {
					this.bgCurrentSet = TableData.BG_FSS;
				}
				break;
			case 'ORRP': this.overridePhysics = this.getInt(buffer); break;
			case 'ORPF': this.overridePhysicsFlipper = this.getBool(buffer); break;
			case 'GAVT': this.gravity = this.getFloat(buffer); break;
			case 'FRCT': this.friction = this.getFloat(buffer); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'ELFA': this.elasticityFalloff = this.getFloat(buffer); break;
			case 'PFSC': this.scatter = this.getFloat(buffer); break;
			case 'SCAT': this.defaultScatter = this.getFloat(buffer); break;
			case 'NDGT': this.nudgeTime = this.getFloat(buffer); break;
			case 'MPGC': this.plungerNormalize = this.getInt(buffer); break;
			case 'MPDF': this.plungerFilter = this.getBool(buffer); break;
			case 'PHML': this.physicsMaxLoops = this.getInt(buffer); break;
			case 'DECL': this.renderDecals = this.getBool(buffer); break;
			case 'REEL': this.renderEMReels = this.getBool(buffer); break;
			case 'OFFX': this.offset.x = this.getFloat(buffer); break;
			case 'OFFY': this.offset.y = this.getFloat(buffer); break;
			case 'ZOOM': this.zoom = this.getFloat(buffer); break;
			case 'MAXSEP': this._3DmaxSeparation = this.getFloat(buffer); break;
			case 'ZPD': this._3DZPD = this.getFloat(buffer); break;
			case 'STO': this._3DOffset = this.getFloat(buffer); break;
			case 'OGST': this.overwriteGlobalStereo3D = this.getBool(buffer); break;
			case 'SLPX': this.angleTiltMax = this.getFloat(buffer); break;
			case 'SLOP': this.angletiltMin = this.getFloat(buffer); break;
			case 'GLAS': this.glassHeight = this.getFloat(buffer); break;
			case 'TBLH': this.tableHeight = this.getFloat(buffer); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			case 'BLIM': this.szBallImage = this.getString(buffer, len); break;
			case 'BLIF': this.szBallImageFront = this.getString(buffer, len); break;
			case 'SSHT': this.szScreenShot = this.getString(buffer, len); break;
			case 'FBCK': this.displayBackdrop = this.getBool(buffer); break;
			case 'SEDT': this.numGameItems = this.getInt(buffer); break;
			case 'SSND': this.numSounds = this.getInt(buffer); break;
			case 'SIMG': this.numTextures = this.getInt(buffer); break;
			case 'SFNT': this.numFonts = this.getInt(buffer); break;
			case 'SCOL': this.numCollections = this.getInt(buffer); break;
			case 'CODE':
				this.scriptPos = offset;
				this.scriptLen = len;
				break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'BIMG': this.bgImage[TableData.BG_DESKTOP] = this.getString(buffer, len); break;
			case 'BIMF': this.bgImage[TableData.BG_FULLSCREEN] = this.getString(buffer, len); break;
			case 'BIMS': this.bgImage[TableData.BG_FSS] = this.getString(buffer, len); break;
			case 'BIMN': this.imageBackdropNightDay = this.getBool(buffer); break;
			case 'IMCG': this.szImageColorGrade = this.getString(buffer, len); break;
			case 'EIMG': this.szEnvImage = this.getString(buffer, len); break;
			case 'PLMA': this.szPlayfieldMaterial = this.getString(buffer, len); break;
			case 'LZAM': this.lightAmbient = this.getInt(buffer); break;
			case 'LZDI': this.Light[0].emission = this.getInt(buffer); break;
			case 'LZHI': this.lightHeight = this.getFloat(buffer); break;
			case 'LZRA': this.lightRange = this.getFloat(buffer); break;
			case 'LIES': this.lightEmissionScale = this.getFloat(buffer); break;
			case 'ENES': this.envEmissionScale = this.getFloat(buffer); break;
			case 'GLES': this.globalEmissionScale = this.getFloat(buffer); break;
			case 'AOSC': this.aoScale = this.getFloat(buffer); break;
			case 'SSSC': this.ssrScale = this.getFloat(buffer); break;
			case 'BREF': this.useReflectionForBalls = this.getInt(buffer); break;
			case 'PLST': this.playfieldReflectionStrength = this.getInt(buffer); break; // m_playfieldReflectionStrength = dequantizeUnsigned<8>(tmp);
			case 'BTRA': this.useTrailForBalls = this.getInt(buffer); break;
			case 'BTST': this.ballTrailStrength = this.getInt(buffer); break; // m_ballTrailStrength = dequantizeUnsigned<8>(tmp);
			case 'BPRS': this.ballPlayfieldReflectionStrength = this.getFloat(buffer); break;
			case 'DBIS': this.defaultBulbIntensityScaleOnBall = this.getFloat(buffer); break;
			case 'UAAL': this.useAA = this.getInt(buffer); break;
			case 'UAOC': this.useAO = this.getInt(buffer); break;
			case 'USSR': this.useSSR = this.getInt(buffer); break;
			case 'UFXA': this.useFXAA = this.getFloat(buffer); break; // TODO getting NaN here
			case 'BLST': this.bloomStrength = this.getFloat(buffer); break;
			case 'BCLR': this.colorBackdrop = this.getInt(buffer); break;
			case 'CCUS': this.rgcolorcustom = this.getUnsignedInt4s(buffer, 16); break;
			case 'TDFT': this.globalDifficulty = this.getFloat(buffer); break;
			case 'CUST': this.szT = this.getString(buffer, len); this.vCustomInfoTag.push(this.szT); break;
			case 'SVOL': this.tableSoundVolume = this.getFloat(buffer); break;
			case 'BDMO': this.ballDecalMode = this.getBool(buffer); break;
			case 'MVOL': this.tableMusicVolume = this.getFloat(buffer); break;
			case 'AVSY': this.tableAdaptiveVSync = this.getInt(buffer); break;
			case 'OGAC': this.overwriteGlobalDetailLevel = this.getBool(buffer); break;
			case 'OGDN': this.overwriteGlobalDayNight = this.getBool(buffer); break;
			case 'GDAC': this.showGrid = this.getBool(buffer); break;
			case 'REOP': this.reflectElementsOnPlayfield = this.getBool(buffer); break;
			case 'ARAC': this.userDetailLevel = this.getInt(buffer); break;
			case 'MASI': this.numMaterials = this.getInt(buffer); break;
			case 'MATE': this.materials = this._getMaterials(buffer, len, this.numMaterials); break;
			case 'PHMA': this._getPhysicsMaterials(buffer, len, this.numMaterials); break;
		}
		return 0;
	}

	private _getMaterials(buffer: Buffer, len: number, num: number): Material[] {
		/* istanbul ignore if */
		if (len < num * SaveMaterial.size) {
			throw new Error('Cannot parse ' + num + ' materials of ' + (num * SaveMaterial.size) + ' bytes from a ' + len + ' bytes buffer.');
		}
		const materials: Material[] = [];
		for (let i = 0; i < num; i++) {
			const saveMat = new SaveMaterial(buffer, i);
			materials.push(Material.fromSaved(saveMat));
		}
		return materials;
	}

	private _getPhysicsMaterials(buffer: Buffer, len: number, num: number): void {
		/* istanbul ignore if */
		if (len < num * SavePhysicsMaterial.size) {
			throw new Error('Cannot parse ' + num + ' physical materials of ' + (num * SavePhysicsMaterial.size) + ' bytes from a ' + len + ' bytes buffer.');
		}
		for (let i = 0; i < num; i++) {
			const savePhysMat = new SavePhysicsMaterial(buffer, i);
			const material = this.materials.find(m => m.name === savePhysMat.name);
			/* istanbul ignore if */
			if (!material) {
				throw new Error('Cannot find material "' + savePhysMat.name + '" in [' + this.materials.map(m => m.name).join(', ') + '] for updating physics.');
			}
			material.physUpdate(savePhysMat);
		}
	}
}

class LightSource {
	public emission?: number;
	public pos?: Vertex3D;
}
