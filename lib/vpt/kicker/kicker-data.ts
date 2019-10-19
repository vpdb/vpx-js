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
import { KickerType } from '../enums';
import { ItemData } from '../item-data';

export class KickerData extends ItemData {

	public kickerType: number = KickerType.Hole;
	public vCenter!: Vertex2D;
	public radius: number = 25;
	public scatter: number = 0.0;
	public hitAccuracy: number = 0.7;
	public hitHeight: number = 40.0;
	public orientation: number = 0.0;
	public szMaterial?: string;
	public szSurface?: string;
	public fallThrough: boolean = false;
	public isEnabled: boolean = true;
	public legacyMode: boolean = false;

	public static async fromStorage(storage: Storage, itemName: string): Promise<KickerData> {
		const kickerData = new KickerData(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(kickerData.fromTag.bind(kickerData), {}));
		return kickerData;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'RADI': this.radius = this.getFloat(buffer); break;
			case 'KSCT': this.scatter = this.getFloat(buffer); break;
			case 'KHAC': this.hitAccuracy = this.getFloat(buffer); break;
			case 'KHHI': this.hitHeight = this.getFloat(buffer); break;
			case 'KORI': this.orientation = this.getFloat(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'EBLD': this.isEnabled = this.getBool(buffer); break;
			case 'TYPE':
				this.kickerType = this.getInt(buffer);
				/* istanbul ignore if: legacy handling */
				if (this.kickerType > KickerType.Cup2) {
					this.kickerType = KickerType.Invisible;
				}
				break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'FATH': this.fallThrough = this.getBool(buffer); break;
			case 'LEMO': this.legacyMode = this.getBool(buffer); break;
			default:
				this.getCommonBlock(buffer, tag, len);
				break;
		}
		return 0;
	}
}
