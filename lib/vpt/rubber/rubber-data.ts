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
import { DragPoint } from '../../math/dragpoint';
import { f4 } from '../../math/float';
import { IPhysicalData, ItemData } from '../item-data';

export class RubberData extends ItemData implements IPhysicalData {

	public height: number = f4(25);
	public hitHeight: number = f4(-1.0);
	public thickness: number = f4(8);
	public hitEvent: boolean = false;
	public szMaterial?: string;
	public szImage?: string;
	public elasticity!: number;
	public elasticityFalloff!: number;
	public friction!: number;
	public scatter!: number;
	public isCollidable: boolean = true;
	public isVisible: boolean = true;
	public isReflectionEnabled: boolean = true;
	public staticRendering: boolean = true;
	public showInEditor: boolean = true;
	public rotX: number = 0;
	public rotY: number = 0;
	public rotZ: number = 0;
	public szPhysicsMaterial?: string;
	public overwritePhysics: boolean = false;
	public dragPoints: DragPoint[] = [];

	public static async fromStorage(storage: Storage, itemName: string): Promise<RubberData> {
		const rubberItem = new RubberData(itemName);
		await storage.streamFiltered(itemName, 4, RubberData.createStreamHandler(rubberItem));
		return rubberItem;
	}

	private static createStreamHandler(rubberItem: RubberData) {
		rubberItem.dragPoints = [];
		return BiffParser.stream(rubberItem.fromTag.bind(rubberItem), {
			nestedTags: {
				DPNT: {
					onStart: () => new DragPoint(),
					onTag: dragPoint => dragPoint.fromTag.bind(dragPoint),
					onEnd: dragPoint => rubberItem.dragPoints.push(dragPoint),
				},
			},
		});
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'HTTP': this.height = this.getFloat(buffer); break;
			case 'HTHI': this.hitHeight = this.getFloat(buffer); break;
			case 'WDTP': this.thickness = this.getInt(buffer); break;
			case 'HTEV': this.hitEvent = this.getBool(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'ELFO': this.elasticityFalloff = this.getFloat(buffer); break;
			case 'RFCT': this.friction = this.getFloat(buffer); break;
			case 'RSCT': this.scatter = this.getFloat(buffer); break;
			case 'CLDR': this.isCollidable = this.getBool(buffer); break;
			case 'RVIS': this.isVisible = this.getBool(buffer); break;
			case 'REEN': this.isReflectionEnabled = this.getBool(buffer); break;
			case 'ESTR': this.staticRendering = this.getBool(buffer); break;
			case 'ESIE': this.showInEditor = this.getBool(buffer); break;
			case 'ROTX': this.rotX = this.getFloat(buffer); break;
			case 'ROTY': this.rotY = this.getFloat(buffer); break;
			case 'ROTZ': this.rotZ = this.getFloat(buffer); break;
			case 'MAPH': this.szPhysicsMaterial = this.getString(buffer, len); break;
			case 'OVPH': this.overwritePhysics = this.getBool(buffer); break;
			case 'PNTS': break; // never read in vpinball
			default:
				this.getCommonBlock(buffer, tag, len);
				break;
		}
		return 0;
	}
}
