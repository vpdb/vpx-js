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

export class Filter {
	public static readonly None = 0;
	public static readonly Additive = 1;
	public static readonly Overlay = 2;
	public static readonly Multiply = 3;
	public static readonly Screen = 4;
}

export class ImageAlignment {
	public static readonly ModeWorld = 0;
	public static readonly ModeWrap = 1;
}

export class LightStatus {
	public static readonly Off = 0;
	public static readonly On = 1;
	public static readonly Blinking = 2;
}

export class RampType {
	public static readonly Flat = 0;
	public static readonly Wire4 = 1;
	public static readonly Wire2 = 2;
	public static readonly Wire3Left = 3;
	public static readonly Wire3Right = 4;
	public static readonly Wire1 = 5;
}

export class GateType {
	public static readonly WireW = 1;
	public static readonly WireRectangle = 2;
	public static readonly Plate = 3;
	public static readonly LongPlate = 4;
}

export class TriggerShape {
	public static readonly None = 0;
	public static readonly WireA = 1;
	public static readonly Star = 2;
	public static readonly WireB = 3;
	public static readonly Button = 4;
	public static readonly WireC = 5;
	public static readonly WireD = 6;
}

export class TargetType {
	public static readonly DropTargetBeveled = 1;
	public static readonly DropTargetSimple = 2;
	public static readonly HitTargetRound = 3;
	public static readonly HitTargetRectangle = 4;
	public static readonly HitFatTargetRectangle = 5;
	public static readonly HitFatTargetSquare = 6;
	public static readonly DropTargetFlatSimple = 7;
	public static readonly HitFatTargetSlim = 8;
	public static readonly HitTargetSlim = 9;
}

export class ItemType {
	public static readonly Surface = 0;
	public static readonly Flipper = 1;
	public static readonly Timer = 2;
	public static readonly Plunger = 3;
	public static readonly Textbox = 4;
	public static readonly Bumper = 5;
	public static readonly Trigger = 6;
	public static readonly Light = 7;
	public static readonly Kicker = 8;
	public static readonly Decal = 9;
	public static readonly Gate = 10;
	public static readonly Spinner = 11;
	public static readonly Ramp = 12;
	public static readonly Table = 13;
	public static readonly LightCenter = 14;
	public static readonly DragPoint = 15;
	public static readonly Collection = 16;
	public static readonly DispReel = 17;
	public static readonly LightSeq = 18;
	public static readonly Primitive = 19;
	public static readonly Flasher = 20;
	public static readonly Rubber = 21;
	public static readonly HitTarget = 22;
	public static readonly Count = 23;
	public static readonly Invalid = 0xffffffff;
}

export class KickerType {

	public static readonly Invisible = 0;
	public static readonly Hole = 1;
	public static readonly Cup = 2;
	public static readonly HoleSimple = 3;
	public static readonly Williams = 4;
	public static readonly Gottlieb = 5;
	public static readonly Cup2 = 6;
}

export class BackgroundType {
	public static readonly Desktop = 0;
	public static readonly FS = 1;
	public static readonly FSS = 2;
}

export class TextAlignment {
	public static readonly Left = 0;
	public static readonly Center = 1;
	public static readonly Right = 2;
}

export class DecalType {
	public static readonly Text = 0;
	public static readonly Image = 1;
}

export class SizingType {
	public static readonly AutoSize = 0;
	public static readonly AutoWidth = 1;
	public static readonly ManualSize = 2;
}
