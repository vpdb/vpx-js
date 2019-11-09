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

import { IEmulator } from '../game/iemulator';
import { logger } from '../util/logger';

/**
 * The VPX interface is sync, while our implementation is not when initializing.
 *
 * This Caching Service caches all calls to the EMU while its initializing and
 * allows to apply the changes once the emu is ready
 */
export class EmulatorMessageQueue {

	private readonly queue: QueueItem[] = [];
	private clearedQueue: boolean = false;

	/**
	 * adds new cache entry
	 * @returns true if entry was added to the cache, false if cache has already been consumed!
	 */
	public addMessage(cacheType: MessageType, value: number): boolean {
		if (this.clearedQueue) {
			logger().warn('ADD STATE TO CLEARED CACHE! ENTRY WILL BE IGNORED!');
			return false;
		}
		this.queue.push({ cacheType, value });
		return true;
	}

	public replayMessages(emulator: IEmulator): void {
		this.clearedQueue = true;
		logger().debug('Replaying %d messages to emu', this.queue.length);
		for (const item of this.queue) {
			switch (item.cacheType) {
				case MessageType.SetSwitchInput:
					emulator.setSwitchInput(item.value, true);
					break;
				case MessageType.ClearSwitchInput:
					emulator.setSwitchInput(item.value, false);
					break;
				case MessageType.ToggleSwitchInput:
					emulator.setSwitchInput(item.value);
					break;
				case MessageType.CabinetInput:
					emulator.setCabinetInput(item.value);
					break;
				case MessageType.ExecuteTicks:
					emulator.emuSimulateCycle(item.value);
					break;
				default:
					logger().warn('UNKNOWN CACHE TYPE', item.cacheType);
			}
		}
	}
}

export enum MessageType {
	SetSwitchInput = 1,
	ClearSwitchInput,
	ToggleSwitchInput,
	CabinetInput,
	ExecuteTicks,
}

interface QueueItem {
	cacheType: MessageType;
	value: number;
}
