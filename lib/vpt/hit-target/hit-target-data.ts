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
import { Vertex3D } from '../../math/vertex3d';
import { ItemData } from '../item-data';
import { HitTarget } from './hit-target';

export class HitTargetData extends ItemData {

	public vPosition!: Vertex3D;
	public vSize: Vertex3D = new Vertex3D(32, 32, 32);
	public rotZ: number = 0;
	public szImage?: string;
	public targetType: number = HitTarget.TypeDropTargetSimple;
	private wzName!: string;
	public szMaterial?: string;
	public fVisible: boolean = true;
	private legacy: boolean = false;
	public isDropped: boolean = false;
	private dropSpeed: number =  0.5;
	private fReflectionEnabled: boolean = true;
	private fUseHitEvent: boolean = true;
	private threshold?: number;
	private elasticity?: number;
	private elasticityFalloff?: number;
	private friction?: number;
	private scatter?: number;
	private fCollidable?: boolean = true;
	private fDisableLightingTop?: number;
	private fDisableLightingBelow?: number;
	private depthBias?: number;
	private fTimerEnabled: boolean = false;
	private TimerInterval?: number;
	private RaiseDelay: number = 100;
	private szPhysicsMaterial?: string;
	private fOverwritePhysics: boolean = false;

	public static async fromStorage(storage: Storage, itemName: string): Promise<HitTargetData> {
		const hitTargetData = new HitTargetData(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(hitTargetData.fromTag.bind(hitTargetData), {}));
		return hitTargetData;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VPOS': this.vPosition = Vertex3D.get(buffer); break;
			case 'VSIZ': this.vSize = Vertex3D.get(buffer); break;
			case 'ROTZ': this.rotZ = this.getFloat(buffer); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			case 'TRTY': this.targetType = this.getInt(buffer); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'TVIS': this.fVisible = this.getBool(buffer); break;
			case 'LEMO': this.legacy = this.getBool(buffer); break;
			case 'ISDR': this.isDropped = this.getBool(buffer); break;
			case 'DRSP': this.dropSpeed = this.getInt(buffer); break;
			case 'REEN': this.fReflectionEnabled = this.getBool(buffer); break;
			case 'HTEV': this.fUseHitEvent = this.getBool(buffer); break;
			case 'THRS': this.threshold = this.getFloat(buffer); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'ELFO': this.elasticityFalloff = this.getFloat(buffer); break;
			case 'RFCT': this.friction = this.getFloat(buffer); break;
			case 'RSCT': this.scatter = this.getFloat(buffer); break;
			case 'CLDR': this.fCollidable = this.getBool(buffer); break;
			case 'DILI': this.fDisableLightingTop = this.getFloat(buffer); break;
			case 'DILB': this.fDisableLightingBelow = this.getFloat(buffer); break;
			case 'PIDB': this.depthBias = this.getFloat(buffer); break;
			case 'RADE': this.RaiseDelay = this.getInt(buffer); break;
			case 'MAPH': this.szPhysicsMaterial = this.getString(buffer, len); break;
			case 'OVPH': this.fOverwritePhysics = this.getBool(buffer); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
