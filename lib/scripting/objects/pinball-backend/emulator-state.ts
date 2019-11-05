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

	private currentLampState: Uint8Array;
	private currentSolenoidState: Uint8Array;
	private currentGIState: Uint8Array;
	private lastSentLampState: Uint8Array;
	private lastSentSolenoidState: Uint8Array;
	private lastSentGIState: Uint8Array;

	constructor() {
		this.lastSentLampState = new Uint8Array();
		this.lastSentSolenoidState = new Uint8Array();
		this.lastSentGIState = new Uint8Array();
		this.currentLampState = new Uint8Array();
		this.currentSolenoidState = new Uint8Array();
		this.currentGIState = new Uint8Array();
	}

	public updateState(state: WpcEmuWebWorkerApi.EmuStateAsic) {
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
		const result: number[][] = this.getArrayDiff(this.lastSentLampState, this.currentLampState);
		this.lastSentLampState = this.currentLampState;
		return result;
	}

	public getChangedSolenoids(): number[][] {
		const result: number[][] = this.getArrayDiff(this.lastSentSolenoidState, this.currentSolenoidState);
		this.lastSentSolenoidState = this.currentSolenoidState;
		return result;
	}

	public getChangedGI(): number[][] {
		const result: number[][] = this.getArrayDiff(this.lastSentGIState, this.currentGIState);
		this.lastSentGIState = this.currentGIState;
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
			if (lastState[n] !== newState[n]) {
				// NOTE: the first entry has index 1 and not 0!
				result.push([n + 1, newState[n]]);
			}
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
