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

import { Storage } from '../..';
import { BiffParser } from '../../io/biff-parser';
import { Vertex2D } from '../../math/vertex2d';
import { ItemData } from '../item-data';

export class FlipperData extends ItemData {

	public wzName!: string;

	public baseRadius: number = 21.5;
	public endRadius: number = 13.0;
	public flipperRadiusMin!: number;
	public flipperRadiusMax: number = 130.0;
	public flipperRadius: number = 130.0;

	public startAngle: number = 121.0;
	public endAngle: number = 70.0;
	public height: number = 50.0;

	public center!: Vertex2D;
	public color = 0xffffff;

	public szImage?: string;
	public szSurface?: string;
	public szMaterial?: string;

	public szRubberMaterial?: string;
	public rubberThickness: number = 7.0;
	public rubberHeight: number = 19.0;
	public rubberWidth: number = 24.0;

	public mass!: number;
	public strength?: number;
	public elasticity?: number;
	public elasticityFalloff?: number;
	public friction?: number;
	public return?: number;
	public rampUp?: number;
	public torqueDamping?: number;
	public torqueDampingAngle?: number;

	public scatter?: number;

	public overrideMass?: number;
	public overrideStrength?: number;
	public overrideElasticity?: number;
	public overrideElasticityFalloff?: number;
	public overrideFriction?: number;
	public overrideReturnStrength?: number;
	public overrideCoilRampUp?: number;
	public overrideTorqueDamping?: number;
	public overrideTorqueDampingAngle?: number;
	public overrideScatterAngle?: number;
	public overridePhysics?: number;

	public fVisible: boolean = true;
	public fEnabled: boolean = true;
	public fReflectionEnabled: boolean = true;

	public static async fromStorage(storage: Storage, itemName: string): Promise<FlipperData> {
		const flipperItem = new FlipperData(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(flipperItem.fromTag.bind(flipperItem)));
		return flipperItem;
	}

	public static fromSerialized(itemName: string, blob: { [key: string]: any }): FlipperData {
		const data = new FlipperData(itemName);

		// primitives
		for (const key of Object.keys(blob)) {
			(data as any)[key] = blob[key];
		}

		// objects
		data.center = new Vertex2D(blob.center._x, blob.center._y);

		return data;
	}

	public getName(): string {
		return this.wzName;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.center = Vertex2D.get(buffer); break;
			case 'BASR': this.baseRadius = this.getFloat(buffer); break;
			case 'ENDR': this.endRadius = this.getFloat(buffer); break;
			case 'FLPR':
				this.flipperRadiusMax = this.getFloat(buffer);
				this.flipperRadius = this.flipperRadiusMax;
				break;
			case 'FRTN': this.return = this.getFloat(buffer); break;
			case 'ANGS': this.startAngle = this.getFloat(buffer); break;
			case 'ANGE': this.endAngle = this.getFloat(buffer); break;
			case 'OVRP': this.overridePhysics = this.getInt(buffer); break;
			case 'FORC': this.mass = this.getFloat(buffer); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'RUMA': this.szRubberMaterial = this.getString(buffer, len); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'RTHK': this.rubberThickness = this.getInt(buffer); break;
			case 'RTHF': this.rubberThickness = this.getFloat(buffer); break;
			case 'RHGT': this.rubberHeight = this.getInt(buffer); break;
			case 'RHGF': this.rubberHeight = this.getFloat(buffer); break;
			case 'RWDT': this.rubberWidth = this.getInt(buffer); break;
			case 'RWDF': this.rubberWidth = this.getFloat(buffer); break;
			case 'FHGT': this.height = this.getFloat(buffer); break;
			case 'STRG': this.strength = this.getFloat(buffer); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'ELFO': this.elasticityFalloff = this.getFloat(buffer); break;
			case 'FRIC': this.friction = this.getFloat(buffer); break;
			case 'RPUP': this.rampUp = this.getFloat(buffer); break;
			case 'SCTR': this.scatter = this.getFloat(buffer); break;
			case 'TODA': this.torqueDamping = this.getFloat(buffer); break;
			case 'TDAA': this.torqueDampingAngle = this.getFloat(buffer); break;
			case 'FRMN': this.flipperRadiusMin = this.getFloat(buffer); break;
			case 'VSBL': this.fVisible = this.getBool(buffer); break;
			case 'ENBL': this.fEnabled = this.getBool(buffer); break;
			case 'REEN': this.fReflectionEnabled = this.getBool(buffer); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
