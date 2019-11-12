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
import { IEmulator } from '../game/iemulator';
import { Vertex2D } from '../math/vertex2d';
import { logger } from '../util/logger';
import { EmulatorMessageQueue, MessageType } from './emulator-message-queue';
import { EmulatorState } from './emulator-state';
import { OffsetIndex } from './offset-index';

const WPC_EMU_INCLUDE_RAM_AND_VIDEORAM_DATA = false;

/**
 * Provides an interface to WPC-EMU
 */
export class Emulator implements IEmulator {

	public readonly emulatorState: EmulatorState = new EmulatorState();
	private readonly emulatorMessageQueue = new EmulatorMessageQueue();
	private readonly dmdSize = new Vertex2D(128, 32);
	private paused: boolean = false;
	private emulator?: WpcEmuApi.Emulator;

	constructor() {
		this.emulator = undefined;
	}

	public async loadGame(gameEntry: GamelistDB.GameEntry, romContent: Uint8Array) {
		const romData: GamelistDB.RomData = { u06: romContent };
		const emulator = await WpcEmuApi.initVMwithRom(romData, gameEntry);

		this.emulator = emulator;
		this.emulator.reset();
		// Let the ROM boot, run for 1000ms
		this.emulator.executeCycleForTime(1000, 4);
		// Set initial state for emulator and press ESC to remove the initial
		// message that the RAM was cleared
		this.emulatorMessageQueue.addMessage(MessageType.CabinetInput, 16);
		this.emulatorMessageQueue.replayMessages(this);
	}

	public isInitialized(): boolean {
		return this.emulator !== undefined;
	}

	public getVersion(): string {
		return WpcEmuApi.getVersion();
	}

	public setPaused(paused: boolean) {
		this.paused = paused;
	}

	public getPaused(): boolean {
		return this.paused;
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
			this.emulatorMessageQueue.addMessage(MessageType.ExecuteTicks, advanceByMs);
			return 0;
		}
		if (this.paused) {
			logger().debug('PAUSED');
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
		const index = OffsetIndex.fromWpcMatrix(switchNr);
		return this.emulatorState.getSwitchState(index);
	}

	/**
	 *
	 * @param lampNr WPC-Numbering (11..88)
	 */
	public getLampState(lampNr: number): number {
		const index = OffsetIndex.fromWpcMatrix(lampNr);
		return this.emulatorState.getLampState(index);
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
				this.emulatorMessageQueue.addMessage(MessageType.SetSwitchInput, switchNr);
			} else if (optionalEnableSwitch === false) {
				this.emulatorMessageQueue.addMessage(MessageType.ClearSwitchInput, switchNr);
			} else {
				this.emulatorMessageQueue.addMessage(MessageType.ToggleSwitchInput, switchNr);
			}
			return true;
		}
		this.emulator.setSwitchInput(switchNr, optionalEnableSwitch);
		return true;
	}

	public setCabinetInput(value: number): void {
		if (!this.emulator) {
			this.emulatorMessageQueue.addMessage(MessageType.CabinetInput, value);
			return;
		}
		this.emulator.setCabinetInput(value);
	}

	public setFliptronicsInput(value: string, optionalEnableSwitch?: boolean): void {
		if (!this.emulator) {
			return;
		}
		this.emulator.setFliptronicsInput(value, optionalEnableSwitch);
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
