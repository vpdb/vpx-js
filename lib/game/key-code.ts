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

export const DIK_ESCAPE = 0x01;
export const DIK_1 = 0x02;
export const DIK_2 = 0x03;
export const DIK_3 = 0x04;
export const DIK_4 = 0x05;
export const DIK_5 = 0x06;
export const DIK_6 = 0x07;
export const DIK_7 = 0x08;
export const DIK_8 = 0x09;
export const DIK_9 = 0x0a;
export const DIK_0 = 0x0b;
export const DIK_MINUS = 0x0c; /* - on main keyboard */
export const DIK_EQUALS = 0x0d;
export const DIK_BACK = 0x0e; /* backspace */
export const DIK_TAB = 0x0f;
export const DIK_Q = 0x10;
export const DIK_W = 0x11;
export const DIK_E = 0x12;
export const DIK_R = 0x13;
export const DIK_T = 0x14;
export const DIK_Y = 0x15;
export const DIK_U = 0x16;
export const DIK_I = 0x17;
export const DIK_O = 0x18;
export const DIK_P = 0x19;
export const DIK_LBRACKET = 0x1a;
export const DIK_RBRACKET = 0x1b;
export const DIK_RETURN = 0x1c; /* Enter on main keyboard */
export const DIK_LCONTROL = 0x1d;
export const DIK_A = 0x1e;
export const DIK_S = 0x1f;
export const DIK_D = 0x20;
export const DIK_F = 0x21;
export const DIK_G = 0x22;
export const DIK_H = 0x23;
export const DIK_J = 0x24;
export const DIK_K = 0x25;
export const DIK_L = 0x26;
export const DIK_SEMICOLON = 0x27;
export const DIK_APOSTROPHE = 0x28;
export const DIK_GRAVE = 0x29; /* accent grave */
export const DIK_LSHIFT = 0x2a;
export const DIK_BACKSLASH = 0x2b;
export const DIK_Z = 0x2c;
export const DIK_X = 0x2d;
export const DIK_C = 0x2e;
export const DIK_V = 0x2f;
export const DIK_B = 0x30;
export const DIK_N = 0x31;
export const DIK_M = 0x32;
export const DIK_COMMA = 0x33;
export const DIK_PERIOD = 0x34; /* . on main keyboard */
export const DIK_SLASH = 0x35; /* / on main keyboard */
export const DIK_RSHIFT = 0x36;
export const DIK_MULTIPLY = 0x37; /* * on numeric keypad */
export const DIK_LALT = 0x38; /* left Alt */
export const DIK_SPACE = 0x39;
export const DIK_CAPITAL = 0x3a;
export const DIK_F1 = 0x3b;
export const DIK_F2 = 0x3c;
export const DIK_F3 = 0x3d;
export const DIK_F4 = 0x3e;
export const DIK_F5 = 0x3f;
export const DIK_F6 = 0x40;
export const DIK_F7 = 0x41;
export const DIK_F8 = 0x42;
export const DIK_F9 = 0x43;
export const DIK_F10 = 0x44;
export const DIK_NUMLOCK = 0x45;
export const DIK_SCROLL = 0x46; /* Scroll Lock */
export const DIK_NUMPAD7 = 0x47;
export const DIK_NUMPAD8 = 0x48;
export const DIK_NUMPAD9 = 0x49;
export const DIK_SUBTRACT = 0x4a; /* - on numeric keypad */
export const DIK_NUMPAD4 = 0x4b;
export const DIK_NUMPAD5 = 0x4c;
export const DIK_NUMPAD6 = 0x4d;
export const DIK_ADD = 0x4e; /* + on numeric keypad */
export const DIK_NUMPAD1 = 0x4f;
export const DIK_NUMPAD2 = 0x50;
export const DIK_NUMPAD3 = 0x51;
export const DIK_NUMPAD0 = 0x52;
export const DIK_DECIMAL = 0x53; /* . on numeric keypad */
export const DIK_F11 = 0x57;
export const DIK_F12 = 0x58;
export const DIK_F13 = 0x64; /*                     (NEC PC98) */
export const DIK_F14 = 0x65; /*                     (NEC PC98) */
export const DIK_F15 = 0x66; /*                     (NEC PC98) */
export const DIK_NUMPADENTER = 0x9c; /* Enter on numeric keypad */
export const DIK_RCONTROL = 0x9d;
export const DIK_DIVIDE = 0xb5;
export const DIK_RALT = 0xb8; /* right Alt */
export const DIK_PAUSE = 0xc5; /* Pause */
export const DIK_HOME = 0xc7; /* Home on arrow keypad */
export const DIK_UP = 0xc8; /* UpArrow on arrow keypad */
export const DIK_PRIOR = 0xc9; /* PgUp on arrow keypad */
export const DIK_LEFT = 0xcb; /* LeftArrow on arrow keypad */
export const DIK_RIGHT = 0xcd; /* RightArrow on arrow keypad */
export const DIK_END = 0xcf; /* End on arrow keypad */
export const DIK_DOWN = 0xd0; /* DownArrow on arrow keypad */
export const DIK_NEXT = 0xd1; /* PgDn on arrow keypad */
export const DIK_INSERT = 0xd2; /* Insert on arrow keypad */
export const DIK_DELETE = 0xd3; /* Delete on arrow keypad */
export const DIK_LWIN = 0xdb; /* Left Windows key */
export const DIK_RWIN = 0xdc; /* Right Windows key */

/**
 * Converts a key-event from the browser to a DirectInput code that is used by
 * the Visual Pinball (and its scripts).
 *
 * @param event Key pressed by the user
 */
export function keyEventToDirectInputKey(event: { key: string; code: string }): number {
	const codeDi = KEY_JS2DI[event.key.toLowerCase()];
	if (codeDi) {
		return codeDi;
	}

	// first try by code (actual key name)
	switch (event.code) {
		case 'ControlLeft':
			return DIK_LCONTROL;
		case 'ControlRight':
			return DIK_RCONTROL;
		case 'ShiftLeft':
			return DIK_LSHIFT;
		case 'ShiftRight':
			return DIK_RSHIFT;
		case 'NumpadMultiply':
			return DIK_MULTIPLY;
		case 'NumpadDivide':
			return DIK_DIVIDE;
		case 'NumpadEnter':
			return DIK_NUMPADENTER;
		case 'AltLeft':
			return DIK_LALT;
		case 'AltRight':
			return DIK_RALT;
		case 'Numpad7':
			return DIK_NUMPAD7;
		case 'Numpad8':
			return DIK_NUMPAD8;
		case 'Numpad9':
			return DIK_NUMPAD9;
		case 'NumpadSubtract':
			return DIK_SUBTRACT;
		case 'Numpad4':
			return DIK_NUMPAD4;
		case 'Numpad5':
			return DIK_NUMPAD5;
		case 'Numpad6':
			return DIK_NUMPAD6;
		case 'NumpadAdd':
			return DIK_ADD;
		case 'Numpad1':
			return DIK_NUMPAD1;
		case 'Numpad2':
			return DIK_NUMPAD2;
		case 'Numpad3':
			return DIK_NUMPAD3;
		case 'Numpad0':
			return DIK_NUMPAD0;
		case 'NumpadDecimal':
			return DIK_DECIMAL;
		case 'MetaLeft':
			return DIK_LWIN;
		case 'MetaRight':
			return DIK_RWIN;
	}

	// main keyboard keys that weren't covered above by numpad
	switch (event.key.toLowerCase()) {
		case '1':
			return DIK_1;
		case '2':
			return DIK_2;
		case '3':
			return DIK_3;
		case '4':
			return DIK_4;
		case '5':
			return DIK_5;
		case '6':
			return DIK_6;
		case '7':
			return DIK_7;
		case '8':
			return DIK_8;
		case '9':
			return DIK_9;
		case '0':
			return DIK_0;
		case '-':
			return DIK_MINUS;
		case '=':
			return DIK_EQUALS;
		case '.':
			return DIK_PERIOD;
		case '/':
			return DIK_SLASH;
		case 'enter':
			return DIK_RETURN;
	}
	return 0;
}

/**
 * Maps Javascript Keycodes to DirectInput key codes.
 *
 * Lowercase, because ascii letters would become upper-cased in case shift
 * was hold, and we only care about the key, not other combinations.
 */
const KEY_JS2DI: { [key: string]: number } = {
	escape: DIK_ESCAPE,
	backspace: DIK_BACK,
	tab: DIK_TAB,
	q: DIK_Q,
	w: DIK_W,
	e: DIK_E,
	r: DIK_R,
	t: DIK_T,
	y: DIK_Y,
	u: DIK_U,
	i: DIK_I,
	o: DIK_O,
	p: DIK_P,
	'[': DIK_LBRACKET,
	']': DIK_RBRACKET,
	a: DIK_A,
	s: DIK_S,
	d: DIK_D,
	f: DIK_F,
	g: DIK_G,
	h: DIK_H,
	j: DIK_J,
	k: DIK_K,
	l: DIK_L,
	';': DIK_SEMICOLON,
	"'": DIK_APOSTROPHE,
	'`': DIK_GRAVE,
	'\\': DIK_BACKSLASH,
	z: DIK_Z,
	x: DIK_X,
	c: DIK_C,
	v: DIK_V,
	b: DIK_B,
	n: DIK_N,
	m: DIK_M,
	',': DIK_COMMA,
	' ': DIK_SPACE,
	capslock: DIK_CAPITAL,
	f1: DIK_F1,
	f2: DIK_F2,
	f3: DIK_F3,
	f4: DIK_F4,
	f5: DIK_F5,
	f6: DIK_F6,
	f7: DIK_F7,
	f8: DIK_F8,
	f9: DIK_F9,
	f10: DIK_F10,
	numlock: DIK_NUMLOCK,
	scrolllock: DIK_SCROLL,
	f11: DIK_F11,
	f12: DIK_F12,
	f13: DIK_F13,
	f14: DIK_F14,
	f15: DIK_F15,
	pause: DIK_PAUSE,
	home: DIK_HOME,
	arrowup: DIK_UP,
	pageup: DIK_PRIOR,
	arrowleft: DIK_LEFT,
	arrowright: DIK_RIGHT,
	end: DIK_END,
	arrowdown: DIK_DOWN,
	pagedown: DIK_NEXT,
	insert: DIK_INSERT,
	delete: DIK_DELETE,

	// other DirectInput codes we don't really care about
	// --------------------------------------------------
	// export const DIK_OEM_102 = 0x56;    /* <> or \| on RT 102-key keyboard (Non-U.S.) */
	// export const DIK_KANA = 0x70;    /* (Japanese keyboard)            */
	// export const DIK_ABNT_C1 = 0x73;    /* /? on Brazilian keyboard */
	// export const DIK_CONVERT = 0x79;    /* (Japanese keyboard)            */
	// export const DIK_NOCONVERT = 0x7B;    /* (Japanese keyboard)            */
	// export const DIK_YEN = 0x7D;    /* (Japanese keyboard)            */
	// export const DIK_ABNT_C2 = 0x7E;    /* Numpad . on Brazilian keyboard */
	// export const DIK_NUMPADEQUALS = 0x8D;    /* = on numeric keypad (NEC PC98) */
	// export const DIK_PREVTRACK = 0x90;    /* Previous Track (DIK_CIRCUMFLEX on Japanese keyboard) */
	// export const DIK_AT = 0x91;    /*                     (NEC PC98) */
	// export const DIK_COLON = 0x92;    /*                     (NEC PC98) */
	// export const DIK_UNDERLINE = 0x93;    /*                     (NEC PC98) */
	// export const DIK_KANJI = 0x94;    /* (Japanese keyboard)            */
	// export const DIK_STOP = 0x95;    /*                     (NEC PC98) */
	// export const DIK_AX = 0x96;    /*                     (Japan AX) */
	// export const DIK_UNLABELED = 0x97;    /*                        (J3100) */
	// export const DIK_NEXTTRACK = 0x99;    /* Next Track */
	// export const DIK_MUTE = 0xA0;    /* Mute */
	// export const DIK_CALCULATOR = 0xA1;    /* Calculator */
	// export const DIK_PLAYPAUSE = 0xA2;    /* Play / Pause */
	// export const DIK_MEDIASTOP = 0xA4;    /* Media Stop */
	// export const DIK_VOLUMEDOWN = 0xAE;    /* Volume - */
	// export const DIK_VOLUMEUP = 0xB0;    /* Volume + */
	// export const DIK_WEBHOME = 0xB2;    /* Web home */
	// export const DIK_NUMPADCOMMA = 0xB3;    /* , on numeric keypad (NEC PC98) */
	// export const DIK_DIVIDE = 0xB5;    /* / on numeric keypad */
	// export const DIK_SYSRQ = 0xB7;
	// export const DIK_APPS = 0xDD;    /* AppMenu key */
	// export const DIK_POWER = 0xDE;    /* System Power */
	// export const DIK_SLEEP = 0xDF;    /* System Sleep */
	// export const DIK_WAKE = 0xE3;    /* System Wake */
	// export const DIK_WEBSEARCH = 0xE5;    /* Web Search */
	// export const DIK_WEBFAVORITES = 0xE6;    /* Web Favorites */
	// export const DIK_WEBREFRESH = 0xE7;    /* Web Refresh */
	// export const DIK_WEBSTOP = 0xE8;    /* Web Stop */
	// export const DIK_WEBFORWARD = 0xE9;    /* Web Forward */
	// export const DIK_WEBBACK = 0xEA;    /* Web Back */
	// export const DIK_MYCOMPUTER = 0xEB;    /* My Computer */
	// export const DIK_MAIL = 0xEC;    /* Mail */
	// export const DIK_MEDIASELECT = 0xED;    /* Media Select */
};
