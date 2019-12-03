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

import { ISoundAdapter } from '../../audio/sound-adapter';
import { Storage } from '../../io/ole-doc';
import { Item } from '../item';
import { Table } from '../table/table';
import { PinSoundData } from './pin-sound-data';

export class PinSound extends Item<PinSoundData> {

	public static async fromStorage(storage: Storage, itemName: string): Promise<PinSound> {
		const data = await PinSoundData.fromStorage(storage, itemName);
		return new PinSound(data);
	}

	public constructor(data: PinSoundData) {
		super(data);
	}

	public async loadSound<T>(table: Table, loader: ISoundAdapter<T>): Promise<T> {
		const data = await table.streamStorage<Buffer>('GameStg', storage => this.streamSound(storage, this.data.itemName));
		if (!data || !data.length) {
			throw new Error(`Cannot load sound data for sound ${this.getName()}`);
		}
		return await loader.loadSound(this.getName(), data);
	}

	private async streamSound(storage: Storage, storageName?: string): Promise<Buffer> {
		const strm = storage.stream(storageName!, this.data.offset, this.data.len);
		return new Promise<Buffer>((resolve, reject) => {
			const bufs: Buffer[] = [];
			/* istanbul ignore if */
			if (!strm) {
				return reject(new Error('No such stream "' + storageName + '".'));
			}
			strm.on('error', reject);
			strm.on('data', (buf: Buffer) => bufs.push(buf));
			strm.on('end', () => resolve(Buffer.concat(bufs)));
		});
	}
}
