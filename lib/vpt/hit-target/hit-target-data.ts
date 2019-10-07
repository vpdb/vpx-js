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
import { f4 } from '../../math/float';
import { Vertex3D } from '../../math/vertex3d';
import { TargetType } from '../enums';
import { IPhysicalData, ItemData } from '../item-data';
import { Table } from '../table/table';

export class HitTargetData extends ItemData implements IPhysicalData {

	public depthBias?: number;
	public disableLightingBelow?: number;
	public disableLightingTop?: number;
	public dropSpeed: number =  0.5;
	public isReflectionEnabled: boolean = true;
	public raiseDelay: number = 100;
	public elasticity!: number;
	public elasticityFalloff!: number;
	public friction!: number;
	public isCollidable: boolean = true;
	public isDropped: boolean = false;
	public isVisible: boolean = true;
	public legacy: boolean = false;
	public overwritePhysics: boolean = false;
	public rotZ: number = 0;
	public scatter!: number;
	public szImage?: string;
	public szMaterial?: string;
	public szPhysicsMaterial?: string;
	public targetType: number = TargetType.DropTargetSimple;
	public threshold: number = 2.0;
	public useHitEvent: boolean = true;
	public vPosition: Vertex3D = new Vertex3D();
	public vSize: Vertex3D = new Vertex3D(32, 32, 32);

	public static async fromStorage(storage: Storage, itemName: string): Promise<HitTargetData> {
		const hitTargetData = new HitTargetData(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(hitTargetData.fromTag.bind(hitTargetData), {}));
		return hitTargetData;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public isDropTarget(): boolean {
		return this.targetType === TargetType.DropTargetBeveled
			|| this.targetType === TargetType.DropTargetFlatSimple
			|| this.targetType === TargetType.DropTargetSimple;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VPOS': this.vPosition = Vertex3D.get(buffer); break;
			case 'VSIZ': this.vSize = Vertex3D.get(buffer); break;
			case 'ROTZ': this.rotZ = this.getFloat(buffer); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			case 'TRTY': this.targetType = this.getInt(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'TVIS': this.isVisible = this.getBool(buffer); break;
			case 'LEMO': this.legacy = this.getBool(buffer); break;
			case 'ISDR': this.isDropped = this.getBool(buffer); break;
			case 'DRSP': this.dropSpeed = this.getFloat(buffer); break;
			case 'REEN': this.isReflectionEnabled = this.getBool(buffer); break;
			case 'HTEV': this.useHitEvent = this.getBool(buffer); break;
			case 'THRS': this.threshold = this.getFloat(buffer); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'ELFO': this.elasticityFalloff = this.getFloat(buffer); break;
			case 'RFCT': this.friction = this.getFloat(buffer); break;
			case 'RSCT': this.scatter = this.getFloat(buffer); break;
			case 'CLDR': this.isCollidable = this.getBool(buffer); break;
			case 'DILI': this.disableLightingTop = this.getFloat(buffer); break;
			case 'DILB': this.disableLightingBelow = this.getFloat(buffer); break;
			case 'PIDB': this.depthBias = this.getFloat(buffer); break;
			case 'RADE': this.raiseDelay = this.getInt(buffer); break;
			case 'MAPH': this.szPhysicsMaterial = this.getString(buffer, len); break;
			case 'OVPH': this.overwritePhysics = this.getBool(buffer); break;
			default:
				this.getCommonBlock(buffer, tag, len);
				break;
		}
		return 0;
	}

	public getPositionZ(z: number, table: Table) {
		return f4(f4(f4(z * table.getScaleZ()) + this.vPosition.z) + table.getTableHeight());
	}
}
