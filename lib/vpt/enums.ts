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

/* tslint:disable:variable-name */

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

export class LightStatus {
	public static readonly LightStateOff = 0;
	public static readonly LightStateOn = 1;
	public static readonly LightStateBlinking = 2;
}

export class BackglassIndex {
	public static readonly DESKTOP = 0;
	public static readonly FULLSCREEN = 1;
	public static readonly FULL_SINGLE_SCREEN = 2;
}

export class Filters {
	public static readonly Filter_None = 0;
	public static readonly Filter_Additive = 1;
	public static readonly Filter_Overlay = 2;
	public static readonly Filter_Multiply = 3;
	public static readonly Filter_Screen = 4;
}

export class ImageAlignment {
	public static readonly ImageAlignWorld = 0;
	public static readonly ImageAlignTopLeft = 1;
	public static readonly ImageAlignCenter = 2;
}

export class Shape {
	public static readonly ShapeCircle = 0;
	public static readonly ShapeCustom = 1;
}

export class TriggerShape {
	public static readonly TriggerNone = 0;
	public static readonly TriggerWireA = 1;
	public static readonly TriggerStar = 2;
	public static readonly TriggerWireB = 3;
	public static readonly TriggerButton = 4;
	public static readonly TriggerWireC = 5;
	public static readonly TriggerWireD = 6;
}

export class RampType {
	public static readonly RampTypeFlat = 0;
	public static readonly RampType4Wire = 1;
	public static readonly RampType2Wire = 2;
	public static readonly RampType3WireLeft = 3;
	public static readonly RampType3WireRight = 4;
	public static readonly RampType1Wire = 5;
}

export class PlungerType {
	public static readonly PlungerTypeModern = 1;
	public static readonly PlungerTypeFlat = 2;
	public static readonly PlungerTypeCustom = 3;
}

export class UserDefaultOnOff {
	public static readonly Default = -1;
	public static readonly Off = 0;
	public static readonly On = 1;
}

export class FXAASettings {
	public static readonly Defaults = -1;
	public static readonly Disabled = 0;
	public static readonly Fast_FXAA = 1;
	public static readonly Standard_FXAA = 2;
	public static readonly Quality_FXAA = 3;
	public static readonly Fast_NFAA = 4;
	public static readonly Standard_DLAA = 5;
	public static readonly Quality_SMAA = 6;
}

export class PhysicsSet {
	public static readonly Disable = 0;
	public static readonly Set1 = 1;
	public static readonly Set2 = 2;
	public static readonly Set3 = 3;
	public static readonly Set4 = 4;
	public static readonly Set5 = 5;
	public static readonly Set6 = 6;
	public static readonly Set7 = 7;
	public static readonly Set8 = 8;
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

export class GateType {
	public static readonly GateWireW = 1;
	public static readonly GateWireRectangle = 2;
	public static readonly GatePlate = 3;
	public static readonly GateLongPlate = 4;
}

export class TextAlignment {
	public static readonly TextAlignLeft = 0;
	public static readonly TextAlignCenter = 1;
	public static readonly TextAlignRight = 2;
}

export class DecalType {
	public static readonly DecalText = 0;
	public static readonly DecalImage = 1;
}

export class SequencerState {
	public static readonly SeqUpOn = 1;
	public static readonly SeqUpOff = 2;
	public static readonly SeqDownOn = 3;
	public static readonly SeqDownOff = 4;
	public static readonly SeqRightOn = 5;
	public static readonly SeqRightOff = 6;
	public static readonly SeqLeftOn = 7;
	public static readonly SeqLeftOff = 8;
	public static readonly SeqDiagUpRightOn = 9;
	public static readonly SeqDiagUpRightOff = 10;
	public static readonly SeqDiagUpLeftOn = 11;
	public static readonly SeqDiagUpLeftOff = 12;
	public static readonly SeqDiagDownRightOn = 13;
	public static readonly SeqDiagDownRightOff = 14;
	public static readonly SeqDiagDownLeftOn = 15;
	public static readonly SeqDiagDownLeftOff = 16;
	public static readonly SeqMiddleOutHorizOn = 17;
	public static readonly SeqMiddleOutHorizOff = 18;
	public static readonly SeqMiddleInHorizOn = 19;
	public static readonly SeqMiddleInHorizOff = 20;
	public static readonly SeqMiddleOutVertOn = 21;
	public static readonly SeqMiddleOutVertOff = 22;
	public static readonly SeqMiddleInVertOn = 23;
	public static readonly SeqMiddleInVertOff = 24;
	public static readonly SeqStripe1HorizOn = 25;
	public static readonly SeqStripe1HorizOff = 26;
	public static readonly SeqStripe2HorizOn = 27;
	public static readonly SeqStripe2HorizOff = 28;
	public static readonly SeqStripe1VertOn = 29;
	public static readonly SeqStripe1VertOff = 30;
	public static readonly SeqStripe2VertOn = 31;
	public static readonly SeqStripe2VertOff = 32;
	public static readonly SeqHatch1HorizOn = 33;
	public static readonly SeqHatch1HorizOff = 34;
	public static readonly SeqHatch2HorizOn = 35;
	public static readonly SeqHatch2HorizOff = 36;
	public static readonly SeqHatch1VertOn = 37;
	public static readonly SeqHatch1VertOff = 38;
	public static readonly SeqHatch2VertOn = 39;
	public static readonly SeqHatch2VertOff = 40;
	public static readonly SeqCircleOutOn = 41;
	public static readonly SeqCircleOutOff = 42;
	public static readonly SeqCircleInOn = 43;
	public static readonly SeqCircleInOff = 44;
	public static readonly SeqClockRightOn = 45;
	public static readonly SeqClockRightOff = 46;
	public static readonly SeqClockLeftOn = 47;
	public static readonly SeqClockLeftOff = 48;
	public static readonly SeqRadarRightOn = 49;
	public static readonly SeqRadarRightOff = 50;
	public static readonly SeqRadarLeftOn = 51;
	public static readonly SeqRadarLeftOff = 52;
	public static readonly SeqWiperRightOn = 53;
	public static readonly SeqWiperRightOff = 54;
	public static readonly SeqWiperLeftOn = 55;
	public static readonly SeqWiperLeftOff = 56;
	public static readonly SeqFanLeftUpOn = 57;
	public static readonly SeqFanLeftUpOff = 58;
	public static readonly SeqFanLeftDownOn = 59;
	public static readonly SeqFanLeftDownOff = 60;
	public static readonly SeqFanRightUpOn = 61;
	public static readonly SeqFanRightUpOff = 62;
	public static readonly SeqFanRightDownOn = 63;
	public static readonly SeqFanRightDownOff = 64;
	public static readonly SeqArcBottomLeftUpOn = 65;
	public static readonly SeqArcBottomLeftUpOff = 66;
	public static readonly SeqArcBottomLeftDownOn = 67;
	public static readonly SeqArcBottomLeftDownOff = 68;
	public static readonly SeqArcBottomRightUpOn = 69;
	public static readonly SeqArcBottomRightUpOff = 70;
	public static readonly SeqArcBottomRightDownOn = 71;
	public static readonly SeqArcBottomRightDownOff = 72;
	public static readonly SeqArcTopLeftUpOn = 73;
	public static readonly SeqArcTopLeftUpOff = 74;
	public static readonly SeqArcTopLeftDownOn = 75;
	public static readonly SeqArcTopLeftDownOff = 76;
	public static readonly SeqArcTopRightUpOn = 77;
	public static readonly SeqArcTopRightUpOff = 78;
	public static readonly SeqArcTopRightDownOn = 79;
	public static readonly SeqArcTopRightDownOff = 80;
	public static readonly SeqScrewRightOn = 81;
	public static readonly SeqScrewRightOff = 82;
	public static readonly SeqScrewLeftOn = 83;
	public static readonly SeqScrewLeftOff = 84;
	public static readonly SeqLastDynamic = 85;
	public static readonly SeqAllOff = 1000;
	public static readonly SeqAllOn = 1001;
	public static readonly SeqBlinking = 1002;
	public static readonly SeqRandom = 1003;
}

export class SizingType {
	public static readonly AutoSize = 0;
	public static readonly AutoWidth = 1;
	public static readonly ManualSize = 2;
}

export class KickerType {
	public static readonly KickerInvisible = 0;
	public static readonly KickerHole = 1;
	public static readonly KickerCup = 2;
	public static readonly KickerHoleSimple = 3;
	public static readonly KickerWilliams = 4;
	public static readonly KickerGottlieb = 5;
	public static readonly KickerCup2 = 6;
}

export class RampImageAlignment {
	public static readonly ImageModeWorld = 0;
	public static readonly ImageModeWrap = 1;
}

export class VBColors {
	public static readonly vbBlack = 0x00;
	public static readonly vbRed = 0xFF;
	public static readonly vbGreen = 0xFF00;
	public static readonly vbYellow = 0xFFFF;
	public static readonly vbBlue = 0xFF0000;
	public static readonly vbMagenta = 0xFF00FF;
	public static readonly vbCyan = 0xFFFF00;
	public static readonly vbWhite = 0xFFFFFF;
}

export class VBComparison {
	public static readonly vbBinaryCompare = 0;
	public static readonly vbTextCompare = 1;
}

export class VBDateTime {
	public static readonly vbSunday = 1;
	public static readonly vbMonday = 2;
	public static readonly vbTuesday = 3;
	public static readonly vbWednesday = 4;
	public static readonly vbThursday = 5;
	public static readonly vbFriday = 6;
	public static readonly vbSaturday = 7;
	public static readonly vbUseSystem = 0;
	public static readonly vbUseSystemDayOfWeek = 0;
	public static readonly vbFirstJan1 = 1;
	public static readonly vbFirstFourDays = 2;
	public static readonly vbFirstFullWeek = 3;
}

export class VBMsgBox {
	public static readonly vbGeneralDate = 0;
	public static readonly vbLongDate = 1;
	public static readonly vbShortDate = 2;
	public static readonly vbLongTime = 3;
	public static readonly vbShortTime = 4;
}

export class VBDateFormat {
	public static readonly vbOKOnly = 0;
	public static readonly vbOKCancel = 1;
	public static readonly vbAbortRetryIgnore = 2;
	public static readonly vbYesNoCancel = 3;
	public static readonly vbYesNo = 4;
	public static readonly vbRetryCancel = 5;
	public static readonly vbCritical = 16;
	public static readonly vbQuestion = 32;
	public static readonly vbExclamation = 48;
	public static readonly vbInformation = 64;
	public static readonly vbDefaultButton1 = 0;
	public static readonly vbDefaultButton2 = 256;
	public static readonly vbDefaultButton3 = 512;
	public static readonly vbDefaultButton4 = 768;
	public static readonly vbApplicationModal = 0;
	public static readonly vbSystemModal = 4096;
}

export class VBMsgBoxReturn {
	public static readonly vbOK = 1;
	public static readonly vbCancel = 2;
	public static readonly vbAbort = 3;
	public static readonly vbRetry = 4;
	public static readonly vbIgnore = 5;
	public static readonly vbYes = 6;
	public static readonly vbNo = 7;
}

export class VBTriState {
	public static readonly vbUseDefault = -2;
	public static readonly vbTrue = -1;
	public static readonly vbFalse = 0;
}

export class VBVarType {
	public static readonly vbEmpty = 0;
	public static readonly vbNull = 1;
	public static readonly vbInteger = 2;
	public static readonly vbLong = 3;
	public static readonly vbSingle = 4;
	public static readonly vbDouble = 5;
	public static readonly vbCurrency = 6;
	public static readonly vbDate = 7;
	public static readonly vbString = 8;
	public static readonly vbObject = 9;
	public static readonly vbError = 10;
	public static readonly vbBoolean = 11;
	public static readonly vbVariant = 12;
	public static readonly vbDataObject = 13;
	public static readonly vbDecimal = 14;
	public static readonly vbByte = 17;
	public static readonly vbArray = 8192;
}

export const apiEnums: { [key: string]: any } = {
	LightState: LightStatus,
	BackglassIndex,
	Filters,
	ImageAlignment,
	Shape,
	TriggerShape,
	RampType,
	PlungerType,
	UserDefaultOnOff,
	FXAASettings,
	PhysicsSet,
	TargetType,
	GateType,
	TextAlignment,
	SequencerState,
	SizingType,
	KickerType,
	RampImageAlignment,
	VBColors,
	VBComparison,
	VBDateTime,
	VBMsgBox,
	VBDateFormat,
	VBMsgBoxReturn,
	VBTriState,
	VBVarType,
};
