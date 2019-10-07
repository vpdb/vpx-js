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
import { Vertex2D } from '../../math/vertex2d';
import { TriggerShape } from '../enums';
import { ItemData } from '../item-data';

export class TriggerData extends ItemData {

	public dragPoints: DragPoint[] = [];
	public vCenter!: Vertex2D;
	public radius: number = 25;
	public rotation: number = 0;
	public scaleX: number = 1;
	public scaleY: number = 1;
	public szMaterial?: string;
	public szSurface?: string;
	public isVisible: boolean = true;
	public isEnabled: boolean = true;
	public hitHeight: number = 50;
	public shape: number = TriggerShape.WireA;
	public animSpeed: number = 1;

	public wireThickness: number = 0;
	public isReflectionEnabled: boolean = true;

	public static async fromStorage(storage: Storage, itemName: string): Promise<TriggerData> {
		const triggerData = new TriggerData(itemName);
		await storage.streamFiltered(itemName, 4, TriggerData.createStreamHandler(triggerData));
		return triggerData;
	}

	private static createStreamHandler(triggerItem: TriggerData) {
		triggerItem.dragPoints = [];
		return BiffParser.stream(triggerItem.fromTag.bind(triggerItem), {
			nestedTags: {
				DPNT: {
					onStart: () => new DragPoint(),
					onTag: dragPoint => dragPoint.fromTag.bind(dragPoint),
					onEnd: dragPoint => triggerItem.dragPoints.push(dragPoint),
				},
			},
		});
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'RADI': this.radius = this.getFloat(buffer); break;
			case 'ROTA': this.rotation = this.getFloat(buffer); break;
			case 'WITI': this.wireThickness = this.getFloat(buffer); break;
			case 'SCAX': this.scaleX = this.getFloat(buffer); break;
			case 'SCAY': this.scaleY = this.getFloat(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'EBLD': this.isEnabled = this.getBool(buffer); break;
			case 'THOT': this.hitHeight = this.getFloat(buffer); break;
			case 'VSBL': this.isVisible = this.getBool(buffer); break;
			case 'REEN': this.isReflectionEnabled = this.getBool(buffer); break;
			case 'SHAP': this.shape = this.getInt(buffer); break;
			case 'ANSP': this.animSpeed = this.getFloat(buffer); break;
			default:
				this.getCommonBlock(buffer, tag, len);
				break;
		}
		return 0;
	}
}
