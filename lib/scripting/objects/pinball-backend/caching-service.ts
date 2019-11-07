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

import { IEmulator } from '../../../game/iemulator';
import { logger } from '../../../util/logger';

/**
 * the VPX interface is sync, while our implementation is not when initializing
 * This Caching Service caches all calls to the EMU while its initializing and
 * allows to apply the changes once the emu is ready
 */
export enum CacheType {
	SetSwitchInput = 1,
	ClearSwitchInput,
	ToggleSwitchInput,
	CabinetInput,
	ExecuteTicks,
}

export class EmulatorCachingService {

	private cache: CacheEntry[];
	private clearedCache: boolean;

	constructor() {
		this.cache = [];
		this.clearedCache = false;
	}

	/**
	 * adds new cache entry
	 * @returns true if entry was added to the cache, false if cache has already been consumed!
	 */
	public cacheState(cacheType: CacheType, value: number): boolean {
		if (this.clearedCache) {
			logger().warn('ADD STATE TO CLEARED CACHE! ENTRY WILL BE IGNORED!');
			return false;
		}
		this.cache.push({ cacheType, value });
		return true;
	}

	public applyCache(emulator: IEmulator): void {
		this.clearedCache = true;
		logger().debug('Apply cached commands to emu', this.cache.length);
		this.cache.forEach((cacheEntry: CacheEntry) => {
			switch (cacheEntry.cacheType) {
				case CacheType.SetSwitchInput:
					return emulator.setSwitchInput(cacheEntry.value, true);
				case CacheType.ClearSwitchInput:
					return emulator.setSwitchInput(cacheEntry.value, false);
				case CacheType.ToggleSwitchInput:
					return emulator.setSwitchInput(cacheEntry.value);
				case CacheType.CabinetInput:
					return emulator.setCabinetInput(cacheEntry.value);
				default:
					logger().warn('UNKNOWN CACHE TYPE', cacheEntry.cacheType);
			}
		});
	}
}

interface CacheEntry {
	cacheType: CacheType;
	value: number;
}
