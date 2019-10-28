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

import { Pool } from '../util/object-pool';
import { Table } from '../vpt/table/table';
import { Event } from './event';
import {
	AssignKey,
	DIK_1,
	DIK_4,
	DIK_5,
	DIK_D,
	DIK_EQUALS,
	DIK_ESCAPE,
	DIK_F10,
	DIK_F11,
	DIK_LALT,
	DIK_LCONTROL,
	DIK_LSHIFT,
	DIK_MINUS,
	DIK_O,
	DIK_Q,
	DIK_RCONTROL,
	DIK_RETURN,
	DIK_RSHIFT,
	DIK_SLASH,
	DIK_SPACE,
	DIK_T,
	DIK_Z,
} from './key-code';
import { Player } from './player';

/* tslint:disable:no-bitwise */
export class PinInput {

	private readonly table: Table;
	private readonly player: Player;
	private readonly diq: DirectInputDeviceObjectData[] = []; // direct input queue

	public readonly rgKeys: { [key: number]: number } = {
		[AssignKey.LeftFlipperKey]: DIK_LCONTROL,
		[AssignKey.RightFlipperKey]: DIK_RCONTROL,
		[AssignKey.LeftTiltKey]: DIK_Z,
		[AssignKey.RightTiltKey]: DIK_SLASH,
		[AssignKey.CenterTiltKey]: DIK_SPACE,
		[AssignKey.PlungerKey]: DIK_RETURN,
		[AssignKey.FrameCount]: DIK_F11,
		[AssignKey.DBGBalls]: DIK_O,
		[AssignKey.Debugger]: DIK_D,
		[AssignKey.AddCreditKey]: DIK_5,
		[AssignKey.AddCreditKey2]: DIK_4,
		[AssignKey.StartGameKey]: DIK_1,
		[AssignKey.MechanicalTilt]: DIK_T,
		[AssignKey.RightMagnaSave]: DIK_RSHIFT,
		[AssignKey.LeftMagnaSave]: DIK_LSHIFT,
		[AssignKey.ExitGame]: DIK_Q,
		[AssignKey.VolumeUp]: DIK_EQUALS,
		[AssignKey.VolumeDown]: DIK_MINUS,
		[AssignKey.LockbarKey]: DIK_LALT,
		[AssignKey.Enable3D]: DIK_F10,
		[AssignKey.Escape]: DIK_ESCAPE,
	};

	constructor(table: Table, player: Player) {
		this.table = table;
		this.player = player;
	}

	public onKeyDown(dkCode: number, timestamp: number) {
		this.diq.push(DirectInputDeviceObjectData.claim(dkCode, 0x80, timestamp));
	}

	public onKeyUp(dkCode: number, timestamp: number) {
		this.diq.push(DirectInputDeviceObjectData.claim(dkCode, 0x0, timestamp));
	}

	private getTail(): DirectInputDeviceObjectData | undefined {
		return this.diq.pop();
	}

	public processKeys(): void {

		let input = this.getTail();
		while (input) {

			if (input.dwSequence === APP_KEYBOARD) {

				// Normal game keys:
				if (input.dwOfs !== this.rgKeys[AssignKey.FrameCount]
					&& input.dwOfs !== this.rgKeys[AssignKey.Enable3D]
					&& input.dwOfs !== this.rgKeys[AssignKey.DBGBalls]) {

					this.fireKeyEvent((input.dwData & 0x80) ? Event.GameEventsKeyDown : Event.GameEventsKeyUp, input.dwOfs);
				}
			}
			input = this.getTail();
		}
	}

	private fireKeyEvent(dispid: Event, keycode: number) {
		this.table.getApi().fireKeyEvent(dispid, keycode);
	}
}

const APP_KEYBOARD = 0;
const APP_JOYSTICKMN = 1;
const APP_MOUSE = 2;

class DirectInputDeviceObjectData {

	public static readonly POOL = new Pool(DirectInputDeviceObjectData);

	public dwOfs: number = 0;
	public dwData: number = 0;
	public dwTimeStamp: number = 0;
	public dwSequence: number = APP_KEYBOARD;

	public set(dwOfs: number, dwData: number, dwTimeStamp: number): this {
		this.dwOfs = dwOfs;
		this.dwData = dwData;
		this.dwTimeStamp = dwTimeStamp;
		return this;
	}

	public static claim(dwOfs: number, dwData: number, dwTimeStamp: number): DirectInputDeviceObjectData {
		return DirectInputDeviceObjectData.POOL.get().set(dwOfs, dwData, dwTimeStamp);
	}

	public static release(...vertices: DirectInputDeviceObjectData[]) {
		for (const vertex of vertices) {
			DirectInputDeviceObjectData.POOL.release(vertex);
		}
	}
}
