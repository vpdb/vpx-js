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

import { Storage } from '..';
import { RenderInfo } from '../game/irenderable';
import { BiffParser } from '../io/biff-parser';
import { Table } from './table/table';

/**
 * Parent class for game items parsed from the VPX file.
 *
 * It contains helper functions for parsing the data.
 */
export abstract class ItemData extends BiffParser {

	public static TypeSurface = 0;
	public static TypeFlipper = 1;
	public static TypeTimer = 2;
	public static TypePlunger = 3;
	public static TypeTextbox = 4;
	public static TypeBumper = 5;
	public static TypeTrigger = 6;
	public static TypeLight = 7;
	public static TypeKicker = 8;
	public static TypeDecal = 9;
	public static TypeGate = 10;
	public static TypeSpinner = 11;
	public static TypeRamp = 12;
	public static TypeTable = 13;
	public static TypeLightCenter = 14;
	public static TypeDragPoint = 15;
	public static TypeCollection = 16;
	public static TypeDispReel = 17;
	public static TypeLightSeq = 18;
	public static TypePrimitive = 19;
	public static TypeFlasher = 20;
	public static TypeRubber = 21;
	public static TypeHitTarget = 22;
	public static TypeCount = 23;
	public static TypeInvalid = 0xffffffff;

	/* istanbul ignore next: this is mainly for debugging stuff. */
	public static getType(type: number): string {
		switch (type) {
			case ItemData.TypeSurface: return 'Surface';
			case ItemData.TypeFlipper: return 'Flipper';
			case ItemData.TypeTimer: return 'Timer';
			case ItemData.TypePlunger: return 'Plunger';
			case ItemData.TypeTextbox: return 'Textbox';
			case ItemData.TypeBumper: return 'Bumper';
			case ItemData.TypeTrigger: return 'Trigger';
			case ItemData.TypeLight: return 'Light';
			case ItemData.TypeKicker: return 'Kicker';
			case ItemData.TypeDecal: return 'Decal';
			case ItemData.TypeGate: return 'Gate';
			case ItemData.TypeSpinner: return 'Spinner';
			case ItemData.TypeRamp: return 'Ramp';
			case ItemData.TypeTable: return 'Table';
			case ItemData.TypeLightCenter: return 'Light Center';
			case ItemData.TypeDragPoint: return 'Drag Point';
			case ItemData.TypeCollection: return 'Collection';
			case ItemData.TypeDispReel: return 'Reel';
			case ItemData.TypeLightSeq: return 'Light Sequence';
			case ItemData.TypePrimitive: return 'Primitive';
			case ItemData.TypeFlasher: return 'Flasher';
			case ItemData.TypeRubber: return 'Rubber';
			case ItemData.TypeHitTarget: return 'Hit Target';
			case ItemData.TypeCount: return 'Count';
			case ItemData.TypeInvalid: return 'Invalid';
		}
		return `Unknown type "${type}"`;
	}

	private pdata?: number;
	private fLocked?: boolean;
	private layerIndex?: number;
	public timer = new TimerDataRoot();
	public readonly itemName: string;

	protected constructor(itemName: string) {
		super();
		this.itemName = itemName;
	}

	public abstract getName(): string;

	protected async getData(storage: Storage, itemName: string, offset: number, len: number): Promise<Buffer> {
		return storage.read(itemName, offset, len);
	}

	protected getUnknownBlock(buffer: Buffer, tag: string) {
		switch (tag) {
			case 'PIID': this.pdata = this.getInt(buffer); break;
			case 'LOCK': this.fLocked = this.getBool(buffer); break;
			case 'LAYR': this.layerIndex = this.getInt(buffer); break;
			case 'TMON': this.timer.enabled = this.getBool(buffer); break;
			case 'TMIN': this.timer.interval = this.getInt(buffer); break;

			default:
				//logger().warn('[GameItem.parseUnknownBlock]: Unknown block "%s".', tag);
				break;
		}
	}
}

export interface IPhysicalData {
	elasticity: number;
	elasticityFalloff?: number;
	friction: number;
	scatter: number;
	overwritePhysics: boolean;
	isCollidable: boolean;
	szPhysicsMaterial?: string;
}

export class TimerDataRoot {
	public interval: number = 0;
	public enabled: boolean = false;
}

export interface Meshes {
	[key: string]: RenderInfo;
}
