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
import { ItemData } from '../item-data';
import { Table } from '../table/table';
import { Light } from './light';

export class LightData extends ItemData {
	public wzName!: string;
	public vCenter!: Vertex2D;
	public falloff: number = 50;
	public falloffPower: number = 2;
	public state: number = Light.StateOff;
	public color: number = 0xffff00;
	public color2: number = 0xffffff;
	public szOffImage?: string;
	public roundLight: boolean = false;
	public rgblinkpattern?: string;
	public blinkinterval: number = 125;
	public intensity: number = 1;
	public transmissionScale: number = 0;
	public szSurface?: string;
	public fBackglass: boolean = false;
	public depthBias?: number;
	public fadeSpeedUp: number = 0.2;
	public fadeSpeedDown: number = 0.2;
	public BulbLight: boolean = false;
	public imageMode: boolean = false;
	public showBulbMesh: boolean = false;
	public staticBulbMesh: boolean = false;
	public showReflectionOnBall: boolean = true;
	public meshRadius: number = 20;
	public modulateVsAdd: number = 0.9;
	public bulbHaloHeight: number = 28;
	public dragPoints: DragPoint[] = [];

	public static async fromStorage(storage: Storage, itemName: string): Promise<LightData> {
		const lightData = new LightData(itemName);
		await storage.streamFiltered(itemName, 4, LightData.createStreamHandler(lightData));
		return lightData;
	}

	private static createStreamHandler(lightItem: LightData) {
		lightItem.dragPoints = [];
		return BiffParser.stream(lightItem.fromTag.bind(lightItem), {
			nestedTags: {
				DPNT: {
					onStart: () => new DragPoint(),
					onTag: dragPoint => dragPoint.fromTag.bind(dragPoint),
					onEnd: dragPoint => lightItem.dragPoints.push(dragPoint),
				},
			},
		});
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	/**
	 * Returns whether this light comes with a bulb mesh.
	 */
	public isBulbLight() {
		return this.showBulbMesh && this.meshRadius > 0;
	}

	/**
	 * Returns whether this light is set inside the playfield (but not
	 * a surface)
	 * @param table
	 */
	public isPlayfieldLight(table: Table) {
		return this.isSurfaceLight(table) && !this.isOnSurface(table);
	}

	private isOnSurface(table: Table) {
		return this.szSurface && table.surfaces[this.szSurface];
	}

	/**
	 * Returns whether this light is either set inside the playfield or another
	 * surface.
	 * @param table
	 */
	public isSurfaceLight(table: Table) {
		if (!this.szOffImage || this.BulbLight) { // in dark knight, we have BulbLight overlays with same texture
			return false;
		}
		if (table.getPlayfieldMap()
			&& this.szOffImage.toLowerCase() === table.getPlayfieldMap().toLowerCase()
			&& this.dragPoints
			&& this.dragPoints.length > 2) {
			return true;
		}

		// go through surfaces and check the same
		for (const surface of Object.values(table.surfaces)) {
			if (surface.image === this.szOffImage) {
				return true;
			}
		}

		/*
		 * Sometimes, the texture used for playfield lights is not the same as the
		 * playfield texture, so we need another way to determine whether a light
		 * is inside the playfield or a surface. The rule is currently the
		 * following:
		 *   - First, it needs a texture.
		 *   - If at least three other lights have the same texture, we assume
		 *     it's a surface light.
		 */
		return Object.values(table.lights).filter(l => l.offImage === this.szOffImage).length > 3;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'RADI': this.falloff = this.getFloat(buffer); break;
			case 'FAPO': this.falloffPower = this.getFloat(buffer); break;
			case 'STAT': this.state = this.getInt(buffer); break;
			case 'COLR': this.color = BiffParser.bgrToRgb(this.getInt(buffer)); break;
			case 'COL2': this.color2 = BiffParser.bgrToRgb(this.getInt(buffer)); break;
			case 'IMG1': this.szOffImage = this.getString(buffer, len); break;
			case 'SHAP': this.roundLight = this.getBool(buffer); break;
			case 'BPAT': this.rgblinkpattern = this.getString(buffer, len); break;
			case 'BINT': this.blinkinterval = this.getInt(buffer); break;
			case 'BWTH': this.intensity = this.getFloat(buffer); break;
			case 'TRMS': this.transmissionScale = this.getFloat(buffer); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'BGLS': this.fBackglass = this.getBool(buffer); break;
			case 'LIDB': this.depthBias = this.getFloat(buffer); break;
			case 'FASP': this.fadeSpeedUp = this.getFloat(buffer); break;
			case 'FASD': this.fadeSpeedDown = this.getFloat(buffer); break;
			case 'BULT': this.BulbLight = this.getBool(buffer); break;
			case 'IMMO': this.imageMode = this.getBool(buffer); break;
			case 'SHBM': this.showBulbMesh = this.getBool(buffer); break;
			case 'STBM': this.staticBulbMesh = this.getBool(buffer); break;
			case 'SHRB': this.showReflectionOnBall = this.getBool(buffer); break;
			case 'BMSC': this.meshRadius = this.getFloat(buffer); break;
			case 'BMVA': this.modulateVsAdd = this.getFloat(buffer); break;
			case 'BHHI': this.bulbHaloHeight = this.getFloat(buffer); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
