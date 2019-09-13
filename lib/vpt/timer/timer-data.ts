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

/**
 * VPinball's timers.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/timer.cpp
 */
export class TimerData extends ItemData {

	public vCenter!: Vertex2D;
	private isBackglass!: boolean;

	public static async fromStorage(storage: Storage, itemName: string): Promise<TimerData> {
		const timerItem = new TimerData(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(timerItem.fromTag.bind(timerItem), {}));
		return timerItem;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public isVisible(): boolean {
		return false;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'BGLS': this.isBackglass = this.getBool(buffer); break;
			default:
				this.getCommonBlock(buffer, tag, len);
				break;
		}
		return 0;
	}
}
