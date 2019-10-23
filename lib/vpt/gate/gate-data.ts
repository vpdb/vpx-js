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
import { GateType } from '../enums';
import { ItemData } from '../item-data';

export class GateData extends ItemData {

	public angleMax: number = Math.PI / 2.0;
	public angleMin: number = 0;
	public damping: number = 0.985;
	public elasticity: number = 0.3;
	public friction: number = 0.02;
	public gateType: number = GateType.GateWireW;
	public gravityFactor: number = 0.25;
	public height: number = 50;
	public isCollidable: boolean = true;
	public isReflectionEnabled: boolean = true;
	public isVisible: boolean = true;
	public length: number = 100;
	public rotation: number = -90;
	public showBracket: boolean = true;
	public szMaterial?: string;
	public szSurface?: string;
	public twoWay: boolean = false;
	public center!: Vertex2D;

	public static async fromStorage(storage: Storage, itemName: string): Promise<GateData> {
		const gateData = new GateData(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(gateData.fromTag.bind(gateData), {}));
		return gateData;
	}

	public constructor(itemName: string) {
		super(itemName);
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'GATY':
				this.gateType = this.getInt(buffer);
				/* istanbul ignore if: Legacy format */
				if (this.gateType < GateType.GateWireW || this.gateType > GateType.GateLongPlate) {// for tables that were saved in the phase where m_type could've been undefined
					this.gateType = GateType.GateWireW;
				}
				break;
			case 'VCEN': this.center = Vertex2D.get(buffer); break;
			case 'LGTH': this.length = this.getFloat(buffer); break;
			case 'HGTH': this.height = this.getFloat(buffer); break;
			case 'ROTA': this.rotation = this.getFloat(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'GSUP': this.showBracket = this.getBool(buffer); break;
			case 'GCOL': this.isCollidable = this.getBool(buffer); break;
			case 'TWWA': this.twoWay = this.getBool(buffer); break;
			case 'GVSB': this.isVisible = this.getBool(buffer); break;
			case 'REEN': this.isReflectionEnabled = this.getBool(buffer); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'GAMA': this.angleMax = this.getFloat(buffer); break;
			case 'GAMI': this.angleMin = this.getFloat(buffer); break;
			case 'GFRC': this.friction = this.getFloat(buffer); break;
			case 'AFRC': this.damping = this.getFloat(buffer); break;
			case 'GGFC': this.gravityFactor = this.getFloat(buffer); break;
			default:
				this.getCommonBlock(buffer, tag, len);
				break;
		}
		return 0;
	}
}
