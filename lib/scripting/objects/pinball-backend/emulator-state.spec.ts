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
import { WpcEmuWebWorkerApi } from 'wpc-emu';
import { EmulatorState } from './emulator-state';

const soundState: WpcEmuWebWorkerApi.EmuStateSound = {
	volume: 0,
	readDataBytes: 0,
	writeDataBytes: 0,
	readControlBytes: 0,
	writeControlBytes: 0,
};

const dmdState: WpcEmuWebWorkerApi.EmuStateDMD = {
	scanline: 0,
	dmdShadedBuffer: new Uint8Array([1,2,3]),
	dmdPageMapping: [],
};

const wpcState1: WpcEmuWebWorkerApi.EmuStateWpc = {
	diagnosticLed: 0,
	lampState: new Uint8Array([1, 0, 0, 0, 0, 255, 127, 128]),
	solenoidState: new Uint8Array([2, 0, 0, 0, 0, 255, 127, 128]),
	generalIlluminationState: new Uint8Array([3, 0, 0, 0, 0, 255, 127, 128]),
	inputState: new Uint8Array([4, 0, 0, 0, 0, 255, 127, 128]),
	diagnosticLedToggleCount: 0,
	midnightModeEnabled: false,
	irqEnabled: false,
	activeRomBank: 0,
	time: 'fooTIME1',
	blankSignalHigh: false,
	watchdogExpiredCounter: 0,
	watchdogTicks: 0,
	zeroCrossFlag: 0,
	inputSwitchMatrixActiveColumn: new Uint8Array([5, 0, 0, 0, 0, 255, 127, 128]),
	lampRow: 0,
	lampColumn: 0,
	wpcSecureScrambler: 0,
};

const wpcState2: WpcEmuWebWorkerApi.EmuStateWpc = {
	diagnosticLed: 1,
	lampState: new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0]),
	solenoidState: new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0]),
	generalIlluminationState: new Uint8Array([3, 0, 0, 0, 0, 0, 0, 0]),
	inputState: new Uint8Array([4, 0, 0, 0, 0, 0, 0, 0]),
	diagnosticLedToggleCount: 1,
	midnightModeEnabled: true,
	irqEnabled: true,
	activeRomBank: 1,
	time: 'fooTIME2',
	blankSignalHigh: true,
	watchdogExpiredCounter: 1,
	watchdogTicks: 1,
	zeroCrossFlag: 1,
	inputSwitchMatrixActiveColumn: new Uint8Array([5, 0, 0, 0, 0, 0, 0, 0]),
	lampRow: 1,
	lampColumn: 1,
	wpcSecureScrambler: 1,
};

/* tslint:disable:no-unused-expression no-string-literal */
chai.use(require('sinon-chai'));
describe('The EmulatorState - handle state changes', () => {

	let emulatorState: EmulatorState;

	const stateOne: WpcEmuWebWorkerApi.EmuStateAsic = {
		ram: new Uint8Array(),
		sound: soundState,
		wpc: wpcState1,
		dmd: dmdState,
	};
	const stateTwo: WpcEmuWebWorkerApi.EmuStateAsic = {
		ram: new Uint8Array(),
		sound: soundState,
		wpc: wpcState2,
		dmd: dmdState,
	};

	beforeEach(() => {
		emulatorState = new EmulatorState();
	});

	it('transition initial getChangedLamps() should return empty array', () => {
		expect(emulatorState.getChangedLamps()).to.deep.equal([]);
	});

	it('transition initial getChangedSolenoids() should return empty array', () => {
		expect(emulatorState.getChangedSolenoids()).to.deep.equal([]);
	});

	it('transition initial getChangedGI() should return empty array', () => {
		expect(emulatorState.getChangedGI()).to.deep.equal([]);
	});

	it('transition empty state -> state 1', () => {
		const expectedDiff: number[][] = [
			[ 11, 0 ],
			[ 12, 0 ],
			[ 13, 0 ],
			[ 14, 0 ],
			[ 15, 0 ],
			[ 16, 1 ],
			[ 17, 0 ],
			[ 18, 1 ],
		];
		emulatorState.updateState(stateOne);
		const result: number[][] = emulatorState.getChangedLamps();
		expect(result).to.deep.equal(expectedDiff);
	});

	it('transition state 1 -> state 2', () => {
		const expectedDiff: number[][] = [
			[ 16, 0 ],
			[ 18, 0 ],
		];
		emulatorState.updateState(stateOne);
		emulatorState.getChangedLamps();
		emulatorState.updateState(stateTwo);
		const result: number[][] = emulatorState.getChangedLamps();
		expect(result).to.deep.equal(expectedDiff);
	});

	it('transition empty state -> state 1 -> state 2, without fetching state', () => {
		const expectedDiff: number[][] = [
			[ 11, 0 ],
			[ 12, 0 ],
			[ 13, 0 ],
			[ 14, 0 ],
			[ 15, 0 ],
			[ 16, 0 ],
			[ 17, 0 ],
			[ 18, 0 ],
		];
		emulatorState.updateState(stateOne);
		emulatorState.updateState(stateTwo);
		const result: number[][] = emulatorState.getChangedLamps();
		expect(result).to.deep.equal(expectedDiff);
	});

	it('transition multiple getChangedLamps() calls without state update should return empty array', () => {
		emulatorState.updateState(stateOne);
		emulatorState.getChangedLamps();
		expect(emulatorState.getChangedLamps()).to.deep.equal([]);
	});

	it('get ChangedLEDs - not implemented used for Alphanumeric displays only', () => {
		const result: number[][] = emulatorState.ChangedLEDs();
		expect(result).to.deep.equal([]);
	});

	it('get empty getDmdScreen', () => {
		const result: Uint8Array = emulatorState.getDmdScreen();
		expect(result.length).to.equal(0);
	});

});
