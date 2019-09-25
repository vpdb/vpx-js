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

export enum AssignKey {
	LeftFlipperKey,
	RightFlipperKey,
	LeftTiltKey,
	RightTiltKey,
	CenterTiltKey,
	PlungerKey,
	FrameCount,
	DBGBalls,
	Debugger,
	AddCreditKey,
	AddCreditKey2,
	StartGameKey,
	MechanicalTilt,
	RightMagnaSave,
	LeftMagnaSave,
	ExitGame,
	VolumeUp,
	VolumeDown,
	LockbarKey,
	Enable3D,
	Escape,
	CKeys,
}
export const DIK_LSHIFT = 0x2A;
export const DIK_RSHIFT = 0x36;
export const DIK_Z = 0x2C;
export const DIK_SLASH = 0x35;
export const DIK_SPACE = 0x39;
export const DIK_RETURN = 0x1C;
export const DIK_F11 = 0x57;
export const DIK_O = 0x18;
export const DIK_D = 0x20;
export const DIK_5 = 0x06;
export const DIK_4 = 0x05;
export const DIK_1 = 0x02;
export const DIK_T = 0x14;
export const DIK_RCONTROL = 0x9D;
export const DIK_LCONTROL = 0x1D;
export const DIK_Q = 0x10;
export const DIK_EQUALS = 0x0D;
export const DIK_MINUS = 0x0C;
export const DIK_LALT = 0x38;
export const DIK_F10 = 0x44;
export const DIK_ESCAPE = 0x01;

/**
 * Converts a key-event from the browser to a DirectInput code that is used by
 * the Visual Pinball (and its scripts).
 *
 * @param event Key pressed by the user
 */
export function keyEventToDirectInputKey(event: KeyboardEvent) {
	const codeDi = KEY_JS2DI[event.key.toLowerCase()];
	if (!codeDi) {
		switch (event.code) {
			case 'ControlLeft': return DIK_LCONTROL; // DIK_LCONTROL
			case 'ControlRight': return DIK_RCONTROL; // DIK_RCONTROL
			case 'ShiftLeft': return DIK_LSHIFT; // DIK_LSHIFT
			case 'ShiftRight': return DIK_RSHIFT; // DIK_RSHIFT
			case 'NumpadMultiply': return 0x37; // DIK_MULTIPLY    /* * on numeric keypad */
			case 'AltLeft': return DIK_LALT; // DIK_LMENU    /* left Alt */
			case 'AltRight': return 0xB8; // DIK_RMENU    /* right Alt */
			case 'Numpad7': return 0x47; // DIK_NUMPAD7
			case 'Numpad8': return 0x48; // DIK_NUMPAD8
			case 'Numpad9': return 0x49; // DIK_NUMPAD9
			case 'NumpadSubtract': return 0x4A; // DIK_SUBTRACT    /* - on numeric keypad */
			case 'Numpad4': return 0x4B; // DIK_NUMPAD4
			case 'Numpad5': return 0x4C; // DIK_NUMPAD5
			case 'Numpad6': return 0x4D; // DIK_NUMPAD6
			case 'NumpadAdd': return 0x4E; // DIK_ADD    /* + on numeric keypad */
			case 'Numpad1': return 0x4F; // DIK_NUMPAD1
			case 'Numpad2': return 0x50; // DIK_NUMPAD2
			case 'Numpad3': return 0x51; // DIK_NUMPAD3
			case 'Numpad0': return 0x52; // DIK_NUMPAD0
			case 'NumpadDecimal': return 0x53; // DIK_DECIMAL    /* . on numeric keypad */
			case 'MetaLeft': return 0xDB; // DIK_LWIN    /* Left Windows key */
			case 'MetaRight': return 0xDC; // DIK_RWIN    /* Right Windows key */
		}
		// main keyboard keys that weren't covered above by numpad
		switch (event.key.toLowerCase()) {
			case '1': return DIK_1; // DIK_1
			case '2': return 0x03; // DIK_2
			case '3': return 0x04; // DIK_3
			case '4': return DIK_4; // DIK_4
			case '5': return DIK_5; // DIK_5
			case '6': return 0x07; // DIK_6
			case '7': return 0x08; // DIK_7
			case '8': return 0x09; // DIK_8
			case '9': return 0x0A; // DIK_9
			case '0': return 0x0B; // DIK_0
			case '-': return DIK_MINUS; // DIK_MINUS    /* - on main keyboard */
			case '=': return DIK_EQUALS; // DIK_EQUALS
			case '.': return 0x34; // DIK_PERIOD    /* . on main keyboard */
			case '/': return DIK_SLASH; // DIK_SLASH    /* / on main keyboard */
		}
	}

}

/**
 * Maps Javascript Keycodes to DirectInput key codes.
 *
 * Lowercase, because ascii letters would become upper-cased in case shift
 * was hold, and we only care about the key, not other combinations.
 */
const KEY_JS2DI: { [key: string]: number } = {

	escape: DIK_ESCAPE, // DIK_ESCAPE
	backspace: 0x0E, // DIK_BACK    /* backspace */
	tab: 0x0F, // DIK_TAB
	q: DIK_Q, // DIK_Q
	w: 0x11, // DIK_W
	e: 0x12, // DIK_E
	r: 0x13, // DIK_R
	t: DIK_T, // DIK_T
	y: 0x15, // DIK_Y
	u: 0x16, // DIK_U
	i: 0x17, // DIK_I
	o: DIK_O, // DIK_O
	p: 0x19, // DIK_P
	'[': 0x1A, // DIK_LBRACKET
	']': 0x1B, // DIK_RBRACKET
	enter: DIK_RETURN, // DIK_RETURN    /* Enter on main keyboard */
	a: 0x1E, // DIK_A
	s: 0x1F, // DIK_S
	d: DIK_D, // DIK_D
	f: 0x21, // DIK_F
	g: 0x22, // DIK_G
	h: 0x23, // DIK_H
	j: 0x24, // DIK_J
	k: 0x25, // DIK_K
	l: 0x26, // DIK_L
	';': 0x27, // DIK_SEMICOLON
	"'": 0x28, // DIK_APOSTROPHE
	'`': 0x29, // DIK_GRAVE    /* accent grave */
	'\\': 0x2B, // DIK_BACKSLASH
	z: DIK_Z, // DIK_Z
	x: 0x2D, // DIK_X
	c: 0x2E, // DIK_C
	v: 0x2F, // DIK_V
	b: 0x30, // DIK_B
	n: 0x31, // DIK_N
	m: 0x32, // DIK_M
	',': 0x33, // DIK_COMMA
	' ': DIK_SPACE, // DIK_SPACE
	capslock: 0x3A, // DIK_CAPITAL
	f1: 0x3B, // DIK_F1
	f2: 0x3C, // DIK_F2
	f3: 0x3D, // DIK_F3
	f4: 0x3E, // DIK_F4
	f5: 0x3F, // DIK_F5
	f6: 0x40, // DIK_F6
	f7: 0x41, // DIK_F7
	f8: 0x42, // DIK_F8
	f9: 0x43, // DIK_F9
	f10: DIK_F10, // DIK_F10
	numlock: 0x45, // DIK_NUMLOCK
	scrolllock: 0x46, // DIK_SCROLL    /* Scroll Lock */
	f11: DIK_F11, // DIK_F11
	f12: 0x58, // DIK_F12
	f13: 0x64, // DIK_F13    /*                     (NEC PC98) */
	f14: 0x65, // DIK_F14    /*                     (NEC PC98) */
	f15: 0x66, // DIK_F15    /*                     (NEC PC98) */
	pause: 0xC5, // DIK_PAUSE    /* Pause */
	home: 0xC7, // DIK_HOME    /* Home on arrow keypad */
	arrowup: 0xC8, // DIK_UP    /* UpArrow on arrow keypad */
	pageup: 0xC9, // DIK_PRIOR    /* PgUp on arrow keypad */
	arrowleft: 0xCB, // DIK_LEFT    /* LeftArrow on arrow keypad */
	arrowright: 0xCD, // DIK_RIGHT    /* RightArrow on arrow keypad */
	end: 0xCF, // DIK_END    /* End on arrow keypad */
	arrowdown: 0xD0, // DIK_DOWN    /* DownArrow on arrow keypad */
	pagedown: 0xD1, // DIK_NEXT    /* PgDn on arrow keypad */
	insert: 0xD2, // DIK_INSERT    /* Insert on arrow keypad */
	delete: 0xD3, // DIK_DELETE    /* Delete on arrow keypad */

	// other DirectInput codes we don't really care about
	// --------------------------------------------------
	// 0: 0x56, // DIK_OEM_102    /* <> or \| on RT 102-key keyboard (Non-U.S.) */
	// 0: 0x70, // DIK_KANA    /* (Japanese keyboard)            */
	// 0: 0x73, // DIK_ABNT_C1    /* /? on Brazilian keyboard */
	// 0: 0x79, // DIK_CONVERT    /* (Japanese keyboard)            */
	// 0: 0x7B, // DIK_NOCONVERT    /* (Japanese keyboard)            */
	// 0: 0x7D, // DIK_YEN    /* (Japanese keyboard)            */
	// 0: 0x7E, // DIK_ABNT_C2    /* Numpad . on Brazilian keyboard */
	// 0: 0x8D, // DIK_NUMPADEQUALS    /* = on numeric keypad (NEC PC98) */
	// 0: 0x90, // DIK_PREVTRACK    /* Previous Track (DIK_CIRCUMFLEX on Japanese keyboard) */
	// 0: 0x91, // DIK_AT    /*                     (NEC PC98) */
	// 0: 0x92, // DIK_COLON    /*                     (NEC PC98) */
	// 0: 0x93, // DIK_UNDERLINE    /*                     (NEC PC98) */
	// 0: 0x94, // DIK_KANJI    /* (Japanese keyboard)            */
	// 0: 0x95, // DIK_STOP    /*                     (NEC PC98) */
	// 0: 0x96, // DIK_AX    /*                     (Japan AX) */
	// 0: 0x97, // DIK_UNLABELED    /*                        (J3100) */
	// 0: 0x99, // DIK_NEXTTRACK    /* Next Track */
	// 0: 0xA0, // DIK_MUTE    /* Mute */
	// 0: 0xA1, // DIK_CALCULATOR    /* Calculator */
	// 0: 0xA2, // DIK_PLAYPAUSE    /* Play / Pause */
	// 0: 0xA4, // DIK_MEDIASTOP    /* Media Stop */
	// 0: 0xAE, // DIK_VOLUMEDOWN    /* Volume - */
	// 0: 0xB0, // DIK_VOLUMEUP    /* Volume + */
	// 0: 0xB2, // DIK_WEBHOME    /* Web home */
	// 0: 0xB3, // DIK_NUMPADCOMMA    /* , on numeric keypad (NEC PC98) */
	// 0: 0xB5, // DIK_DIVIDE    /* / on numeric keypad */
	// 0: 0xB7, // DIK_SYSRQ
	// 0: 0xDD, // DIK_APPS    /* AppMenu key */
	// 0: 0xDE, // DIK_POWER    /* System Power */
	// 0: 0xDF, // DIK_SLEEP    /* System Sleep */
	// 0: 0xE3, // DIK_WAKE    /* System Wake */
	// 0: 0xE5, // DIK_WEBSEARCH    /* Web Search */
	// 0: 0xE6, // DIK_WEBFAVORITES    /* Web Favorites */
	// 0: 0xE7, // DIK_WEBREFRESH    /* Web Refresh */
	// 0: 0xE8, // DIK_WEBSTOP    /* Web Stop */
	// 0: 0xE9, // DIK_WEBFORWARD    /* Web Forward */
	// 0: 0xEA, // DIK_WEBBACK    /* Web Back */
	// 0: 0xEB, // DIK_MYCOMPUTER    /* My Computer */
	// 0: 0xEC, // DIK_MAIL    /* Mail */
	// 0: 0xED, // DIK_MEDIASELECT    /* Media Select */
};
