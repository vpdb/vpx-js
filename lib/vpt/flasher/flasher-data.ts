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
import { Filter, ImageAlignment } from '../enums';
import { ItemData } from '../item-data';

export class FlasherData extends ItemData {

	private height: number = 50.0;
	private center: Vertex2D = new Vertex2D();
	private rotX: number = 0.0;
	private rotY: number = 0.0;
	private rotZ: number = 0.0;
	private color: number = 0xffffff;
	private szImageA?: string;
	private szImageB?: string;
	private alpha: number = 100;
	private modulateVsAdd: number = 0.9;
	private isVisible: boolean = true;
	private addBlend: boolean = false;
	private isDMD: boolean = false;
	private displayTexture: boolean = false;
	private depthBias: number = 0.0;
	private imageAlignment: number = ImageAlignment.ModeWrap;
	private filter: number = Filter.Overlay;
	private filterAmount: number = 100;
	private dragPoints: DragPoint[] = [];

	public static async fromStorage(storage: Storage, itemName: string): Promise<FlasherData> {
		const flasherData = new FlasherData(itemName);
		await storage.streamFiltered(itemName, 4, FlasherData.createStreamHandler(flasherData));
		return flasherData;
	}

	private static createStreamHandler(flasherData: FlasherData) {
		return BiffParser.stream(flasherData.fromTag.bind(flasherData), {
			nestedTags: {
				DPNT: {
					onStart: () => new DragPoint(),
					onTag: dragPoint => dragPoint.fromTag.bind(dragPoint),
					onEnd: dragPoint => flasherData.dragPoints.push(dragPoint),
				},
			},
		});
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'FHEI': this.height = this.getFloat(buffer); break;
			case 'FLAX': this.center.x = this.getFloat(buffer); break;
			case 'FLAY': this.center.x = this.getFloat(buffer); break;
			case 'FROX': this.rotX = this.getFloat(buffer); break;
			case 'FROY': this.rotY = this.getFloat(buffer); break;
			case 'FROZ': this.rotZ = this.getFloat(buffer); break;
			case 'COLR': this.color = this.getFloat(buffer); break;
			case 'IMAG': this.szImageA = this.getString(buffer, len); break;
			case 'IMAB': this.szImageB = this.getString(buffer, len); break;
			case 'FALP': this.alpha = Math.max(0, this.getInt(buffer)); break;
			case 'MOVA': this.modulateVsAdd = this.getFloat(buffer); break;
			case 'FVIS': this.isVisible = this.getBool(buffer); break;
			case 'ADDB': this.addBlend = this.getBool(buffer); break;
			case 'IDMD': this.isDMD = this.getBool(buffer); break;
			case 'DSPT': this.displayTexture = this.getBool(buffer); break;
			case 'FLDB': this.depthBias = this.getFloat(buffer); break;
			case 'ALGN': this.imageAlignment = this.getInt(buffer); break;
			case 'FILT': this.filter = this.getInt(buffer); break;
			case 'FIAM': this.filterAmount = this.getInt(buffer); break;
			default:
				this.getCommonBlock(buffer, tag, len);
				break;
		}
		return 0;
	}
}
