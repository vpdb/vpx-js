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

	private lastKnownState?: WpcEmuWebWorkerApi.EmuState;
	private lastKnownLampState: Uint8Array;
	private lastKnownSolenoidState: Uint8Array;
	private lastKnownGIState: Uint8Array;

	constructor() {
		this.lastKnownState = undefined;
		this.lastKnownLampState = new Uint8Array();
		this.lastKnownSolenoidState = new Uint8Array();
		this.lastKnownGIState = new Uint8Array();
	}

	public clearState() {
		this.lastKnownState = undefined;
		this.lastKnownLampState = new Uint8Array();
		this.lastKnownSolenoidState = new Uint8Array();
		this.lastKnownGIState = new Uint8Array();
	}

	public updateState(state: WpcEmuWebWorkerApi.EmuState) {
		this.lastKnownState = state;
	}

	public getChangedLamps(): number[][] {
		if (!this.lastKnownState || !this.lastKnownState.wpc.lampState) {
			return [];
		}

		const result: number[][] = this.getArrayDiff(this.lastKnownLampState, this.lastKnownState.wpc.lampState);
		this.lastKnownLampState = this.lastKnownState.wpc.lampState;
		return result;
	}

	public getChangedSolenoids(): number[][] {
		if (!this.lastKnownState || !this.lastKnownState.wpc.solenoidState) {
			return [];
		}

		const result: number[][] = this.getArrayDiff(this.lastKnownSolenoidState, this.lastKnownState.wpc.solenoidState);
		this.lastKnownSolenoidState = this.lastKnownState.wpc.solenoidState;
		return result;
	}

	public getChangedGI(): number[][] {
		if (!this.lastKnownState || !this.lastKnownState.wpc.generalIlluminationState) {
			return [];
		}

		const result: number[][] = this.getArrayDiff(this.lastKnownSolenoidState, this.lastKnownState.wpc.generalIlluminationState);
		this.lastKnownGIState = this.lastKnownState.wpc.generalIlluminationState;
		return result;
	}

	// NOT IMPLEMENTED YET - needed for alphanumeric games
	public ChangedLEDs(): number[][] {
		return [];
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
