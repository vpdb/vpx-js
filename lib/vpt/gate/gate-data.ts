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
import { ItemData } from '../item-data';
import { Gate } from './gate';

export class GateData extends ItemData {

	public gateType: number = Gate.TypeGateWireW;
	public vCenter!: Vertex2D;
	public length: number = 100;
	public height: number = 50;
	public rotation: number = -90;
	public szMaterial?: string;
	private fTimerEnabled?: boolean;
	public fShowBracket: boolean = true;
	private fCollidable: boolean = true;
	private twoWay: boolean = false;
	public fVisible: boolean = true;
	private fReflectionEnabled: boolean = true;
	private TimerInterval?: number;
	public szSurface?: string;
	private wzName!: string;
	private elasticity?: number;
	private angleMax: number = Math.PI / 2.0;
	private angleMin: number = 0;
	private friction?: number;
	private damping?: number;
	private gravityfactor?: number;

	public static async fromStorage(storage: Storage, itemName: string): Promise<GateData> {
		const gateData = new GateData(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(gateData.fromTag.bind(gateData), {}));
		return gateData;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'GATY':
				this.gateType = this.getInt(buffer);
				/* istanbul ignore if: Legacy format */
				if (this.gateType < Gate.TypeGateWireW || this.gateType > Gate.TypeGateLongPlate) {// for tables that were saved in the phase where m_type could've been undefined
					this.gateType = Gate.TypeGateWireW;
				}
				break;
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'LGTH': this.length = this.getFloat(buffer); break;
			case 'HGTH': this.height = this.getFloat(buffer); break;
			case 'ROTA': this.rotation = this.getFloat(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'GSUP': this.fShowBracket = this.getBool(buffer); break;
			case 'GCOL': this.fCollidable = this.getBool(buffer); break;
			case 'TWWA': this.twoWay = this.getBool(buffer); break;
			case 'GVSB': this.fVisible = this.getBool(buffer); break;
			case 'REEN': this.fReflectionEnabled = this.getBool(buffer); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'GAMA': this.angleMax = this.getFloat(buffer); break;
			case 'GAMI': this.angleMin = this.getFloat(buffer); break;
			case 'GFRC': this.friction = this.getFloat(buffer); break;
			case 'AFRC': this.damping = this.getFloat(buffer); break;
			case 'GGFC': this.gravityfactor = this.getFloat(buffer); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
