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

import { GamelistDB, WpcEmuApi, WpcEmuWebWorkerApi } from 'wpc-emu';
import { IEmulator } from '../../../game/iemulator';
import { logger } from '../../../util/logger';
import { EmulatorState } from './emulator-state';
import { Vertex2D } from '../../../math/vertex2d';

const WPC_EMU_INCLUDE_RAM_AND_VIDEORAM_DATA = false;

export class Emulator implements IEmulator {
	private emulator?: WpcEmuApi.Emulator;
	public readonly emulatorState: EmulatorState;
	private readonly dmdSize = new Vertex2D(128, 32);
	private romLoading: boolean;

	constructor() {
		logger().debug('HELLO FROM WPC CONTROLLER');
		this.emulator = undefined;
		this.romLoading = false;
		this.emulatorState = new EmulatorState();
	}

	public loadGame(gameEntry: GamelistDB.GameEntry, romContent: Uint8Array) {
		const romData: GamelistDB.RomData = { u06: romContent };
		this.romLoading = true;
		return WpcEmuApi.initVMwithRom(romData, gameEntry)
			.then((emulator: WpcEmuApi.Emulator) => {
				this.emulator = emulator;
				this.romLoading = false;
				this.emulator.reset();
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

	public emuSimulateCycle(advanceByMs: number): number {
		if (!this.emulator) {
			return 0;
		}
		const executedCycles: number = this.emulator.executeCycleForTime(advanceByMs, 16);
		const emuState: WpcEmuWebWorkerApi.EmuState = this.emulator.getUiState(WPC_EMU_INCLUDE_RAM_AND_VIDEORAM_DATA);
		//logger().debug('TICKS', emuState.cpuState.tickCount);
		this.emulatorState.updateState(emuState.asic);
		return executedCycles;
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

	// TODO, this emuchecking sucks...
	public getState(): WpcEmuWebWorkerApi.EmuState | undefined {
		if (!this.emulator) {
			return;
		}
		return this.emulator.getUiState();
	}

	public getDmdDimensions(): Vertex2D {
		return this.dmdSize;
	}

	/**
	 * returns the content of the DMD display, 1 byte per pixel
	 * values range from 0 (dark) to 3 (bright) - this means the Uint8Array needs to be postprocessed
	 */
	public getDmdFrame(): Uint8Array {
		return this.emulatorState.getDmdScreen();
	}

}
