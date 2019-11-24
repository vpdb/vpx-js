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

import * as chai from 'chai';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { GamelistDB, WpcEmuApi, WpcEmuWebWorkerApi } from 'wpc-emu';
import { Vertex2D } from '../math/vertex2d';
import { Emulator } from './wpc-emu';

const mockGameEntry: GamelistDB.GameEntry = {
	name: 'foo',
	rom: {
		u06: 'lala',
	},
};

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('WPC-EMU', () => {

	const sandbox = sinon.createSandbox();
	let emulator: Emulator;
	let mockEmu: MockWpcEmulator;

	beforeEach(() => {
		mockEmu = new MockWpcEmulator();
		sandbox.stub(WpcEmuApi, 'initVMwithRom').resolves(mockEmu);
		emulator = new Emulator();
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('should getVersion', () => {
		const result: string = emulator.getVersion();
		expect(result.length > 4).to.equal(true);
	});

	it('should not be initialized by default', () => {
		const result: boolean = emulator.isInitialized();
		expect(result).to.equal(false);
	});

	it('should get getDmdFrame', () => {
		const result: Uint8Array = emulator.getDmdFrame();
		expect(result.length).to.equal(0);
	});

	it('should ignore registerAudioConsumer when emu is not initialized', () => {
		emulator.registerAudioConsumer((audioJSON: WpcEmuApi.AudioMessage) => {
			// do nothing
		});
	});

	it('should return correct sized DmdDimensions', () => {
		const result: Vertex2D = emulator.getDmdDimensions();
		expect(result.x).to.equal(128);
		expect(result.y).to.equal(32);
	});

	it('should ignore calls as long as the emu is not initialized', () => {
		emulator.setSwitchInput(4);
		emulator.setSwitchInput(4, true);
		emulator.setSwitchInput(4, false);
		emulator.setCabinetInput(4);
		emulator.setDipSwitchByte(44);
		emulator.setFliptronicsInput('FOO');
		const executedSteps = emulator.emuSimulateCycle(200);
		expect(executedSteps).to.equal(0);
	});

	it('should load the emulator', async () => {
		await emulator.loadGame(mockGameEntry, new Uint8Array());
		expect(mockEmu.executedCyclesMs).to.equal(1000);
		expect(mockEmu.cabinetInput).to.deep.equal([ 16 ]);
	});

	it('should call WPC-Emu emuSimulateCycle when initialized', async () => {
		await emulator.loadGame(mockGameEntry, new Uint8Array());
		emulator.emuSimulateCycle(20);
		expect(mockEmu.executedCyclesMs).to.equal(1020);
	});

	it('should call WPC-Emu setSwitchInput when initialized', async () => {
		await emulator.loadGame(mockGameEntry, new Uint8Array());
		emulator.setSwitchInput(20);
		expect(mockEmu.switchInput).to.deep.equal([ 20 ]);
	});

	it('should call WPC-Emu fliptronicsInput when initialized', async () => {
		await emulator.loadGame(mockGameEntry, new Uint8Array());
		emulator.setFliptronicsInput('A123');
		expect(mockEmu.fliptronicsInput).to.deep.equal([ 'A123' ]);
	});

	it('should call WPC-Emu set DipSwitchByte when initialized', async () => {
		await emulator.loadGame(mockGameEntry, new Uint8Array());
		emulator.setDipSwitchByte(44);
		expect(mockEmu.dipSwitchInput).to.deep.equal([ 44 ]);
	});

	it('should get DipSwitchByte when emu is not initialized', async () => {
		const result = emulator.getDipSwitchByte();
		expect(result).to.equal(0);
	});

	it('should call WPC-Emu registerAudioConsumer when initialized', async () => {
		await emulator.loadGame(mockGameEntry, new Uint8Array());
		let playSampleId = -1;
		emulator.registerAudioConsumer((audioJSON: WpcEmuApi.AudioMessage) => {
			if (audioJSON.id) {
				playSampleId = audioJSON.id;
			}
		});
		expect(playSampleId).to.equal(123);
	});

	it('should update WPC-Emu state after emuSimulateCycle is run', async () => {
		await emulator.loadGame(mockGameEntry, new Uint8Array());
		emulator.emuSimulateCycle(20);
		expect(emulator.getSwitchInput(11)).to.equal(0);
		expect(emulator.getLampState(11)).to.equal(1);
		expect(emulator.getLampState(12)).to.equal(0);
		expect(emulator.getSolenoidState(0)).to.equal(11);
		expect(emulator.getGIState(0)).to.equal(8);
		expect(emulator.getDipSwitchByte()).to.equal(23);
	});

});

class MockWpcEmulator implements WpcEmuApi.Emulator {
	public executedCyclesMs: number = 0;
	public cabinetInput: number[] = [];
	public fliptronicsInput: string[] = [];
	public switchInput: number[] = [];
	public dipSwitchInput: number[] = [];
	public start(): void {
		throw new Error('Method not implemented.');
	}
	public getUiState(includeExpensiveData?: boolean): WpcEmuWebWorkerApi.EmuState {
		return {
			asic: {
				sound: {
					volume: 1,
					readDataBytes: 2,
					writeDataBytes: 3,
					readControlBytes: 4,
					writeControlBytes: 5,
				},
				wpc: {
					diagnosticLed: 6,
					generalIlluminationState: new Uint8Array([ 8, 2, 3, 4]),
					diagnosticLedToggleCount: 7,
					lampState: new Uint8Array([ 255, 0 ]),
					solenoidState: new Uint8Array([ 11, 2, 3, 4]),
					inputState: new Uint8Array([ 1, 2, 3, 4]),
					midnightModeEnabled: true,
					irqEnabled: true,
					activeRomBank: 8,
					time: '9',
					blankSignalHigh: false,
					watchdogExpiredCounter: 10,
					watchdogTicks: 11,
					zeroCrossFlag: 12,
					inputSwitchMatrixActiveColumn: new Uint8Array(),
					lampRow: 13,
					lampColumn: 14,
					wpcSecureScrambler: 15,
				},
				dmd: {
					scanline: 16,
					dmdPageMapping: [],
				},
			},
			cpuState: {
				regPC: 44,
				regS: 44,
				regU: 44,
				regA: 44,
				regB: 44,
				firqCount: 44,
				irqCount: 44,
				missedFIRQ: 44,
				missedIRQ: 44,
				nmiCount: 44,
				regCC: 44,
				regDP: 44,
				regX: 44,
				regY: 44,
				tickCount: 44,
			},
			opsMs: 100,
			protectedMemoryWriteAttempts: 101,
		 runtime: 102,
		 ticksIrq: 103,
		 version: 104,
		};
	}
	public getState(): WpcEmuWebWorkerApi.EmuState {
		throw new Error('Method not implemented.');
	}
	public setState(stateObject: WpcEmuWebWorkerApi.EmuState): void {
		throw new Error('Method not implemented.');
	}
	registerAudioConsumer(callbackFunction: (audioJSON: WpcEmuApi.AudioMessage) => void): void {
		callbackFunction({ command: 'FOO', id: 123 });
	}
	public executeCycle(ticksToRun: number, tickSteps: number): number {
		throw new Error('Method not implemented.');
	}
	public executeCycleForTime(advanceByMs: number, tickSteps: number): number {
		this.executedCyclesMs += advanceByMs;
		return 0;
	}
	public setCabinetInput(value: number): void {
		this.cabinetInput.push(value);
	}
	public setSwitchInput(switchNr: number, optionalValue?: boolean): void {
		this.switchInput.push(switchNr);
	}
	public setFliptronicsInput(value: string): void {
		this.fliptronicsInput.push(value);
	}
	public toggleMidnightMadnessMode(): void {
		throw new Error('Method not implemented.');
	}
	public reset(): void {
		// ignored
	}
	public version(): string {
		throw new Error('Method not implemented.');
	}
	public setDipSwitchByte(dipSwitch: number): void {
		this.dipSwitchInput.push(dipSwitch);
	}
	public getDipSwitchByte(): number {
		return 23;
	}
}
