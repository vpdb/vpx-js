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
import { Vertex2D } from '../../../math/vertex2d';
import { logger } from '../../../util/logger';
import { CacheType, EmulatorCachingService } from './caching-service';
import { EmulatorState } from './emulator-state';

const WPC_EMU_INCLUDE_RAM_AND_VIDEORAM_DATA = false;

/**
 * Provides an interface to WPC-EMU
 */
export class Emulator implements IEmulator {
	public readonly emulatorState: EmulatorState;
	private emulator?: WpcEmuApi.Emulator;
	private emulatorCachingService: EmulatorCachingService;
	private readonly dmdSize = new Vertex2D(128, 32);

	constructor() {
		logger().debug('HELLO FROM WPC CONTROLLER');
		this.emulator = undefined;
		this.emulatorState = new EmulatorState();
		this.emulatorCachingService = new EmulatorCachingService();
	}

	public loadGame(gameEntry: GamelistDB.GameEntry, romContent: Uint8Array) {
		const romData: GamelistDB.RomData = { u06: romContent };
		return WpcEmuApi.initVMwithRom(romData, gameEntry)
			.then((emulator: WpcEmuApi.Emulator) => {
				this.emulator = emulator;
				this.emulator.reset();

				this.emulatorCachingService.applyCache(this);

				//TODO HACK - used to launch the rom - if we have a RAM state, this would be obsolete!
				setTimeout(() => {
					logger().info('ESC!');
					emulator.setCabinetInput(16);
				}, 2000);
			});
	}

	public isInitialized(): boolean {
		return this.emulator !== undefined;
	}

	public getVersion(): string {
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
			this.emulatorCachingService.cacheState(CacheType.ExecuteTicks, advanceByMs);
			return 0;
		}
		const executedCycles: number = this.emulator.executeCycleForTime(advanceByMs, 16);
		const emuState: WpcEmuWebWorkerApi.EmuState = this.emulator.getUiState(WPC_EMU_INCLUDE_RAM_AND_VIDEORAM_DATA);
		//logger().debug('TICKS', emuState.cpuState.tickCount);

		// TODO - we need to stay in sync with VPX as the expected ticks to run and the actual ticks that did run will not match
		this.emulatorState.updateState(emuState.asic);
		return executedCycles;
	}

	public getSwitchInput(switchNr: number): number {
		return this.emulatorState.getSwitchState(switchNr);
	}

	public getLampState(lampNr: number): number {
		return this.emulatorState.getLampState(lampNr);
	}

	public getSolenoidState(SolenoidNr: number): number {
		return this.emulatorState.getSolenoidState(SolenoidNr);
	}

	public getGIState(giNr: number): number {
		return this.emulatorState.getGIState(giNr);
	}

	/**
	 * Update Switch State
	 * @param switchNr which switch number (11..88) to modifiy
	 * @param optionalEnableSwitch if this parameter is missing, the switch will be toggled, else set to the defined state
	 */
	public setSwitchInput(switchNr: number, optionalEnableSwitch?: boolean): boolean {
		if (!this.emulator) {
			if (optionalEnableSwitch === true) {
				this.emulatorCachingService.cacheState(CacheType.SetSwitchInput, switchNr);
			} else if (optionalEnableSwitch === false) {
				this.emulatorCachingService.cacheState(CacheType.ClearSwitchInput, switchNr);
			} else {
				this.emulatorCachingService.cacheState(CacheType.ToggleSwitchInput, switchNr);
			}
			return true;
		}
		this.emulator.setSwitchInput(switchNr, optionalEnableSwitch);
		return true;
	}

	public setCabinetInput(value: number): void {
		if (!this.emulator) {
			this.emulatorCachingService.cacheState(CacheType.CabinetInput, value);
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
