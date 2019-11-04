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

import { WpcEmuWebWorkerApi } from 'wpc-emu';
import { logger } from '../../../util/logger';

export class EmulatorState {

	private lastKnownLampState: Uint8Array;
	private currentLampState: Uint8Array;
	private lastKnownSolenoidState: Uint8Array;
	private currentSolenoidState: Uint8Array;
	private lastKnownGIState: Uint8Array;
	private currentGIState: Uint8Array;

	constructor() {
		this.lastKnownLampState = new Uint8Array();
		this.lastKnownSolenoidState = new Uint8Array();
		this.lastKnownGIState = new Uint8Array();
		this.currentLampState = new Uint8Array();
		this.currentSolenoidState = new Uint8Array();
		this.currentGIState = new Uint8Array();
	}

	public updateState(state: WpcEmuWebWorkerApi.EmuState) {
		if (state.wpc.lampState) {
			this.currentLampState = this.normalize(state.wpc.lampState);
		}
		if (state.wpc.solenoidState) {
			this.currentSolenoidState = state.wpc.solenoidState;
		}
		if (state.wpc.generalIlluminationState) {
			this.currentGIState = state.wpc.generalIlluminationState;
		}
	}

	public getChangedLamps(): number[][] {
		const result: number[][] = this.getArrayDiff(this.lastKnownLampState, this.currentLampState);
		this.lastKnownLampState = this.currentLampState;
		return result;
	}

	public getChangedSolenoids(): number[][] {
		const result: number[][] = this.getArrayDiff(this.lastKnownSolenoidState, this.currentSolenoidState);
		this.lastKnownSolenoidState = this.currentSolenoidState;
		return result;
	}

	public getChangedGI(): number[][] {
		const result: number[][] = this.getArrayDiff(this.lastKnownSolenoidState, this.currentGIState);
		this.lastKnownGIState = this.currentGIState;
		return result;
	}

	// NOT IMPLEMENTED YET - needed for alphanumeric games only!
	public ChangedLEDs(): number[][] {
		return [];
	}

	/**
	 * map uint8 values to 0 or 1 (VisualPinball engine)
	 */
	private normalize(input: Uint8Array): Uint8Array {
		return input.map((value) => value > 127 ? 1 : 0);
	}

	/**
	 * diff between two arrays equally sized arrays
	 * returns 2 dimensional array with the result, eg [0, 5], [4, 44] -> means entry at offset 0 changed to 5, entry at offset 4 changed to 44
	 */
	private getArrayDiff(lastState: Uint8Array, newState: Uint8Array): number[][] {
		const result: number[][] = [];
		if (arraysEqual(lastState, newState)) {
			return result;
		}
		for (let n: number = 0; n < newState.length; n++) {
			if (lastState[n] === newState[n]) {
				continue;
			}
			result.push([n, newState[n]]);
		}
		return result;
	}
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a === b) {
		return true;
	}
	if (!a || !b || a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}
