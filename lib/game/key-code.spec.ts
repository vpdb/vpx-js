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

import { expect } from 'chai';
import {
	DIK_0,
	DIK_1,
	DIK_2,
	DIK_3,
	DIK_4,
	DIK_5,
	DIK_6,
	DIK_7,
	DIK_8,
	DIK_9,
	DIK_ADD,
	DIK_BACK,
	DIK_COMMA,
	DIK_DECIMAL,
	DIK_DELETE,
	DIK_DIVIDE,
	DIK_DOWN,
	DIK_END,
	DIK_EQUALS,
	DIK_ESCAPE,
	DIK_HOME,
	DIK_INSERT,
	DIK_LALT,
	DIK_LCONTROL,
	DIK_LEFT,
	DIK_LSHIFT,
	DIK_LWIN,
	DIK_MINUS,
	DIK_MULTIPLY,
	DIK_NEXT,
	DIK_NUMPAD0,
	DIK_NUMPAD1,
	DIK_NUMPAD2,
	DIK_NUMPAD3,
	DIK_NUMPAD4,
	DIK_NUMPAD5,
	DIK_NUMPAD6,
	DIK_NUMPAD7,
	DIK_NUMPAD8,
	DIK_NUMPAD9,
	DIK_NUMPADENTER,
	DIK_PERIOD,
	DIK_PRIOR,
	DIK_Q,
	DIK_RALT,
	DIK_RCONTROL,
	DIK_RETURN,
	DIK_RIGHT,
	DIK_RSHIFT,
	DIK_RWIN,
	DIK_SLASH,
	DIK_SPACE,
	DIK_SUBTRACT,
	DIK_TAB,
	DIK_UP,
	DIK_Z,
	keyEventToDirectInputKey,
} from './key-code';

describe('The VPinball keyboard scan codes', () => {

	it('should correctly map control keys', async () => {
		expect(keyEventToDirectInputKey({ key: 'Control', code: 'ControlLeft' } as any)).to.equal(DIK_LCONTROL);
		expect(keyEventToDirectInputKey({ key: 'Control', code: 'ControlRight' } as any)).to.equal(DIK_RCONTROL);
		expect(keyEventToDirectInputKey({ key: 'Shift', code: 'ShiftLeft' } as any)).to.equal(DIK_LSHIFT);
		expect(keyEventToDirectInputKey({ key: 'Shift', code: 'ShiftRight' } as any)).to.equal(DIK_RSHIFT);
		expect(keyEventToDirectInputKey({ key: 'Alt', code: 'AltLeft' } as any)).to.equal(DIK_LALT);
		expect(keyEventToDirectInputKey({ key: 'AltGraph', code: 'AltRight' } as any)).to.equal(DIK_RALT);
		expect(keyEventToDirectInputKey({ key: 'ArrowLeft', code: 'ArrowLeft' } as any)).to.equal(DIK_LEFT);
		expect(keyEventToDirectInputKey({ key: 'ArrowUp', code: 'ArrowUp' } as any)).to.equal(DIK_UP);
		expect(keyEventToDirectInputKey({ key: 'ArrowRight', code: 'ArrowRight' } as any)).to.equal(DIK_RIGHT);
		expect(keyEventToDirectInputKey({ key: 'ArrowDown', code: 'ArrowDown' } as any)).to.equal(DIK_DOWN);
		expect(keyEventToDirectInputKey({ key: 'PageDown', code: 'PageDown' } as any)).to.equal(DIK_NEXT);
		expect(keyEventToDirectInputKey({ key: 'End', code: 'End' } as any)).to.equal(DIK_END);
		expect(keyEventToDirectInputKey({ key: 'Delete', code: 'Delete' } as any)).to.equal(DIK_DELETE);
		expect(keyEventToDirectInputKey({ key: 'Insert', code: 'Insert' } as any)).to.equal(DIK_INSERT);
		expect(keyEventToDirectInputKey({ key: 'Home', code: 'Home' } as any)).to.equal(DIK_HOME);
		expect(keyEventToDirectInputKey({ key: 'PageUp', code: 'PageUp' } as any)).to.equal(DIK_PRIOR);
		expect(keyEventToDirectInputKey({ key: 'Escape', code: 'Escape' } as any)).to.equal(DIK_ESCAPE);
		expect(keyEventToDirectInputKey({ key: 'Backspace', code: 'Backspace' } as any)).to.equal(DIK_BACK);
		expect(keyEventToDirectInputKey({ key: 'Meta', code: 'MetaLeft' } as any)).to.equal(DIK_LWIN);
		expect(keyEventToDirectInputKey({ key: 'Meta', code: 'MetaRight' } as any)).to.equal(DIK_RWIN);
		expect(keyEventToDirectInputKey({ key: 'Tab', code: 'Tab' } as any)).to.equal(DIK_TAB);
	});

	it('should correctly map numpad keys', async () => {
		expect(keyEventToDirectInputKey({ key: '/', code: 'NumpadDivide' } as any)).to.equal(DIK_DIVIDE);
		expect(keyEventToDirectInputKey({ key: '*', code: 'NumpadMultiply' } as any)).to.equal(DIK_MULTIPLY);
		expect(keyEventToDirectInputKey({ key: '-', code: 'NumpadSubtract' } as any)).to.equal(DIK_SUBTRACT);
		expect(keyEventToDirectInputKey({ key: '+', code: 'NumpadAdd' } as any)).to.equal(DIK_ADD);
		expect(keyEventToDirectInputKey({ key: '0', code: 'Numpad0' } as any)).to.equal(DIK_NUMPAD0);
		expect(keyEventToDirectInputKey({ key: '1', code: 'Numpad1' } as any)).to.equal(DIK_NUMPAD1);
		expect(keyEventToDirectInputKey({ key: '2', code: 'Numpad2' } as any)).to.equal(DIK_NUMPAD2);
		expect(keyEventToDirectInputKey({ key: '3', code: 'Numpad3' } as any)).to.equal(DIK_NUMPAD3);
		expect(keyEventToDirectInputKey({ key: '4', code: 'Numpad4' } as any)).to.equal(DIK_NUMPAD4);
		expect(keyEventToDirectInputKey({ key: '5', code: 'Numpad5' } as any)).to.equal(DIK_NUMPAD5);
		expect(keyEventToDirectInputKey({ key: '6', code: 'Numpad6' } as any)).to.equal(DIK_NUMPAD6);
		expect(keyEventToDirectInputKey({ key: '7', code: 'Numpad7' } as any)).to.equal(DIK_NUMPAD7);
		expect(keyEventToDirectInputKey({ key: '8', code: 'Numpad8' } as any)).to.equal(DIK_NUMPAD8);
		expect(keyEventToDirectInputKey({ key: '9', code: 'Numpad9' } as any)).to.equal(DIK_NUMPAD9);
		expect(keyEventToDirectInputKey({ key: '.', code: 'NumpadDecimal' } as any)).to.equal(DIK_DECIMAL);
		expect(keyEventToDirectInputKey({ key: 'Enter', code: 'NumpadEnter' } as any)).to.equal(DIK_NUMPADENTER);
	});

	it('should correctly map numeric keys', async () => {
		expect(keyEventToDirectInputKey({ key: '0', code: 'Digit0' } as any)).to.equal(DIK_0);
		expect(keyEventToDirectInputKey({ key: '1', code: 'Digit1' } as any)).to.equal(DIK_1);
		expect(keyEventToDirectInputKey({ key: '2', code: 'Digit2' } as any)).to.equal(DIK_2);
		expect(keyEventToDirectInputKey({ key: '3', code: 'Digit3' } as any)).to.equal(DIK_3);
		expect(keyEventToDirectInputKey({ key: '4', code: 'Digit4' } as any)).to.equal(DIK_4);
		expect(keyEventToDirectInputKey({ key: '5', code: 'Digit5' } as any)).to.equal(DIK_5);
		expect(keyEventToDirectInputKey({ key: '6', code: 'Digit6' } as any)).to.equal(DIK_6);
		expect(keyEventToDirectInputKey({ key: '7', code: 'Digit7' } as any)).to.equal(DIK_7);
		expect(keyEventToDirectInputKey({ key: '8', code: 'Digit8' } as any)).to.equal(DIK_8);
		expect(keyEventToDirectInputKey({ key: '9', code: 'Digit9' } as any)).to.equal(DIK_9);
		expect(keyEventToDirectInputKey({ key: '-', code: 'Minus' } as any)).to.equal(DIK_MINUS);
		expect(keyEventToDirectInputKey({ key: '=', code: 'Equal' } as any)).to.equal(DIK_EQUALS);
		expect(keyEventToDirectInputKey({ key: '.', code: 'Period' } as any)).to.equal(DIK_PERIOD);
		expect(keyEventToDirectInputKey({ key: ',', code: 'Comma' } as any)).to.equal(DIK_COMMA);
		expect(keyEventToDirectInputKey({ key: '/', code: 'Slash' } as any)).to.equal(DIK_SLASH);
		expect(keyEventToDirectInputKey({ key: 'Enter', code: 'Enter' } as any)).to.equal(DIK_RETURN);
	});

	it('should correctly map other keys', async () => {
		expect(keyEventToDirectInputKey({ key: ' ', code: 'Space' } as any)).to.equal(DIK_SPACE);
		expect(keyEventToDirectInputKey({ key: 'q', code: 'KeyQ' } as any)).to.equal(DIK_Q);
		expect(keyEventToDirectInputKey({ key: 'Q', code: 'KeyQ' } as any)).to.equal(DIK_Q);
		expect(keyEventToDirectInputKey({ key: 'z', code: 'KeyZ' } as any)).to.equal(DIK_Z);
	});

});
