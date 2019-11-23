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
import { ReadResult } from '../../io/ole-doc';
import { ItemData } from '../item-data';

export class PinSoundData extends ItemData {

	public path: string = '';
	public internalName: string = '';

	private pos = 0;

	public static async fromStorage(storage: Storage, itemName: string): Promise<PinSoundData> {
		const soundData = new PinSoundData(itemName);
		await storage.streamFiltered(itemName, 0, soundData.stream.bind(soundData));
		return soundData;
	}

	public async stream(result: ReadResult): Promise<number | null> {
		const len = this.getInt(result.data);
		this.pos++;
		switch (this.pos) {
			case 1: this.name = this.getString(result.data, len + 4); return len + 4;
			case 2: this.path = this.getString(result.data, len + 4); return len + 4;
			case 3: this.internalName = this.getString(result.data, len + 4); return len + 4;
		}
		return null;
	}

	public constructor(itemName: string) {
		super(itemName);
	}
}
