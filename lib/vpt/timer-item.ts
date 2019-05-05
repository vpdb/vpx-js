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

import { BiffParser } from '../io/biff-parser';
import { Storage } from '../io/ole-doc';
import { Vertex2D } from '../math/vertex2d';
import { GameItem } from './game-item';

/**
 * VPinball's gates.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/gate.cpp
 */
export class TimerItem extends GameItem {

	private length: number = 100;
	private vCenter!: Vertex2D;
	private wzName!: string;
	private fBackglass!: boolean;

	public static async fromStorage(storage: Storage, itemName: string): Promise<TimerItem> {
		const timerItem = new TimerItem();
		await storage.streamFiltered(itemName, 4, BiffParser.stream(timerItem.fromTag.bind(timerItem), {}));
		return timerItem;
	}

	public getName(): string {
		return this.wzName;
	}

	public isVisible(): boolean {
		return false;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'BGLS': this.fBackglass = this.getBool(buffer); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
