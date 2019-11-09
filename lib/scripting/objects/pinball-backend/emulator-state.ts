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

function getEmptyUint8Array(size: number = 64) {
	return new Uint8Array(size).fill(0);
}
/**
 * This class encapsulates the WPC-EMU state and transform state object
 */
export class EmulatorState {

	private currentLampState: Uint8Array = getEmptyUint8Array();
	private currentSolenoidState: Uint8Array = getEmptyUint8Array();
	private currentGIState: Uint8Array = getEmptyUint8Array();
	private lastSentLampState: Uint8Array = getEmptyUint8Array();
	private lastSentSolenoidState: Uint8Array = getEmptyUint8Array();
	private lastSentGIState: Uint8Array = getEmptyUint8Array();
	private dmdScreen: Uint8Array = new Uint8Array();
	private switchState: Uint8Array = new Uint8Array();

	public updateState(state: WpcEmuWebWorkerApi.EmuStateAsic) {
		if (state.wpc.lampState) {
			this.currentLampState = this.normalizeValue(state.wpc.lampState);
		}
		if (state.wpc.solenoidState) {
			//TODO unclear if we need to normalize
			this.currentSolenoidState = state.wpc.solenoidState;
		}
		if (state.wpc.generalIlluminationState) {
			//TODO unclear if we need to normalize
			this.currentGIState = state.wpc.generalIlluminationState;
		}
		if (state.dmd.dmdShadedBuffer) {
			this.dmdScreen = state.dmd.dmdShadedBuffer;
		}
		if (state.wpc.inputSwitchMatrixActiveColumn) {
			this.switchState = state.wpc.inputSwitchMatrixActiveColumn;
		}
	}

	public getSwitchState(index: number): number {
		const matrixIndex: number = mapIndexToMatrixIndex(index);
		return this.switchState[matrixIndex] || 0;
	}

	public getLampState(index: number): number {
		const matrixIndex: number = mapIndexToMatrixIndex(index);
		return this.currentLampState[matrixIndex] || 0;
	}

	public getSolenoidState(index: number): number {
		const matrixIndex: number = index++;
		return this.currentSolenoidState[matrixIndex] || 0;
	}

	public getGIState(index: number): number {
		const matrixIndex: number = index++;
		return this.currentGIState[matrixIndex] || 0;
	}

	/**
	 * return changed lamps, index starts at 11..18, 21..28.. up to index 88
	 */
	public getChangedLamps(): number[][] {
		const result: number[][] = this.getArrayDiff(this.lastSentLampState, this.currentLampState, mapIndexToMatrixIndex);
		this.lastSentLampState = this.currentLampState;
		return result;
	}

	/**
	 * return changed solenoids, index starts at
	 */
	public getChangedSolenoids(): number[][] {
		const result: number[][] = this.getArrayDiff(this.lastSentSolenoidState, this.currentSolenoidState, mapIndexToOneBasedIndex);
		this.lastSentSolenoidState = this.currentSolenoidState;
		return result;
	}

	public getChangedGI(): number[][] {
		const result: number[][] = this.getArrayDiff(this.lastSentGIState, this.currentGIState, mapIndexToOneBasedIndex);
		this.lastSentGIState = this.currentGIState;
		return result;
	}

	// NOT IMPLEMENTED YET - needed for alphanumeric games only!
	public ChangedLEDs(): number[][] {
		return [];
	}

	public getDmdScreen(): Uint8Array {
		return this.dmdScreen;
	}

	/**
	 * map uint8 values to 0 or 1 (VisualPinball engine)
	 */
	private normalizeValue(input: Uint8Array): Uint8Array {
		return input.map((value) => value > 127 ? 1 : 0);
	}

	/**
	 * diff between two arrays equally sized arrays
	 * returns 2 dimensional array with the result, eg [0, 5], [4, 44] -> means entry at offset 0 changed to 5, entry at offset 4 changed to 44
	 */
	private getArrayDiff(lastState: Uint8Array, newState: Uint8Array, offsetMapperFunction: (index: number) => number): number[][] {
		const result: number[][] = [];
		for (let n: number = 0; n < newState.length; n++) {
			if (lastState[n] !== newState[n]) {
				const index = offsetMapperFunction(n);
				result.push([index, newState[n]]);
			}
		}
		return result;
	}
}

function mapIndexToMatrixIndex(index: number): number {
	const row = Math.floor(index / 8);
	const column = Math.floor(index % 8);
	return 10 * row + 11 + column;
}

function mapIndexToOneBasedIndex(index: number): number {
	return index + 1;
}
