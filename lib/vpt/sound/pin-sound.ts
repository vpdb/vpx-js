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
import { Item } from '../item';
import { PinSoundData } from './pin-sound-data';

export class PinSound extends Item<PinSoundData> {

	public static async fromStorage(storage: Storage, itemName: string): Promise<PinSound> {
		const data = await PinSoundData.fromStorage(storage, itemName);
		return new PinSound(data);
	}

	public constructor(data: PinSoundData) {
		super(data);
	}
}
