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

import { GamelistDB, WpcEmuApi } from 'wpc-emu';
import { logger } from '../../../util/logger';

export class Emulator {
	private emulator?: WpcEmuApi.Emulator;
	private romLoading: boolean;

	constructor() {
		logger().debug('HELLO FROM WPC CONTROLLER');
		this.emulator = undefined;
		this.romLoading = false;
	}

	public loadGame(gameName: string) {
		const romData: GamelistDB.RomData = { u06: new Uint8Array(128 * 1024) };
		const gameEntry: GamelistDB.GameEntry = {
			name: 'foo',
			rom: {
				u06: 'my.rom',
			},
			skipWpcRomCheck: false,
			fileName: 'fooname',
			features: ['wpc95'],
		};
		this.romLoading = true;
		return WpcEmuApi.initVMwithRom(romData, gameEntry)
			.then((emulator: WpcEmuApi.Emulator) => {
				this.emulator = emulator;
				this.romLoading = false;
			});
	}

	public getVersion(): string {
		if (!this.emulator) {
			return 'unknown';
		}
		return WpcEmuApi.getVersion();
	}

	public registerAudioConsumer(callbackFunction: (sampleId: number) => void): void {
		// TODO store registerAudioConsumer, and use it when emu is started
		if (!this.emulator) {
			return;
		}
		this.emulator.registerAudioConsumer(callbackFunction);
	}

	public executeCycleForTime(advanceByMs: number): number {
		if (!this.emulator) {
			return 0;
		}
		return this.emulator.executeCycleForTime(advanceByMs, 16);
	}

	public setInput(switchNr: number): void {
		if (!this.emulator) {
			return;
		}
		this.emulator.setInput(switchNr);
	}

	public setCabinetInput(value: number): void {
		if (!this.emulator) {
			return;
		}
		this.emulator.setCabinetInput(value);
	}

	public setFliptronicsInput(value: string): void {
		if (!this.emulator) {
			return;
		}
		this.emulator.setFliptronicsInput(value);
	}

}
