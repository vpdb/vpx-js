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

import { VbsApi } from '../scripting/vbs-api';

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

export class LightStatus extends VbsApi {
	public readonly LightStateOff = 0;
	public readonly LightStateOn = 1;
	public readonly LightStateBlinking = 2;

	protected _getPropertyNames(): string[] {
		return ['LightStateOff', 'LightStateOn', 'LightStateBlinking'];
	}
}

export class BackglassIndex extends VbsApi {
	public readonly DESKTOP = 0;
	public readonly FULLSCREEN = 1;
	public readonly FULL_SINGLE_SCREEN = 2;

	protected _getPropertyNames(): string[] {
		return ['DESKTOP', 'FULLSCREEN', 'FULL_SINGLE_SCREEN'];
	}
}

export class Filters extends VbsApi {
	public readonly Filter_None = 0;
	public readonly Filter_Additive = 1;
	public readonly Filter_Overlay = 2;
	public readonly Filter_Multiply = 3;
	public readonly Filter_Screen = 4;

	protected _getPropertyNames(): string[] {
		return ['Filter_None', 'Filter_Additive', 'Filter_Overlay', 'Filter_Multiply', 'Filter_Screen'];
	}
}

export class ImageAlignment extends VbsApi {
	public readonly ImageAlignWorld = 0;
	public readonly ImageAlignTopLeft = 1;
	public readonly ImageAlignCenter = 2;

	protected _getPropertyNames(): string[] {
		return ['ImageAlignWorld', 'ImageAlignTopLeft', 'ImageAlignCenter'];
	}
}

export class Shape extends VbsApi {
	public readonly ShapeCircle = 0;
	public readonly ShapeCustom = 1;

	protected _getPropertyNames(): string[] {
		return ['ShapeCircle', 'ShapeCustom'];
	}
}

export class TriggerShape extends VbsApi {
	public readonly TriggerNone = 0;
	public readonly TriggerWireA = 1;
	public readonly TriggerStar = 2;
	public readonly TriggerWireB = 3;
	public readonly TriggerButton = 4;
	public readonly TriggerWireC = 5;
	public readonly TriggerWireD = 6;

	protected _getPropertyNames(): string[] {
		return ['TriggerNone', 'TriggerWireA', 'TriggerStar', 'TriggerWireB', 'TriggerButton', 'TriggerWireC',
			'TriggerWireD'];
	}
}

export class RampType extends VbsApi {
	public readonly RampTypeFlat = 0;
	public readonly RampType4Wire = 1;
	public readonly RampType2Wire = 2;
	public readonly RampType3WireLeft = 3;
	public readonly RampType3WireRight = 4;
	public readonly RampType1Wire = 5;

	protected _getPropertyNames(): string[] {
		return ['RampTypeFlat', 'RampType4Wire', 'RampType2Wire', 'RampType3WireLeft', 'RampType3WireRight',
			'RampType1Wire'];
	}
}

export class PlungerType extends VbsApi {
	public readonly PlungerTypeModern = 1;
	public readonly PlungerTypeFlat = 2;
	public readonly PlungerTypeCustom = 3;

	protected _getPropertyNames(): string[] {
		return ['PlungerTypeModern', 'PlungerTypeFlat', 'PlungerTypeCustom'];
	}
}

export class UserDefaultOnOff extends VbsApi {
	public readonly Default = -1;
	public readonly Off = 0;
	public readonly On = 1;

	protected _getPropertyNames(): string[] {
		return ['Default', 'Off', 'On'];
	}
}

export class FXAASettings extends VbsApi {
	public readonly Defaults = -1;
	public readonly Disabled = 0;
	public readonly Fast_FXAA = 1;
	public readonly Standard_FXAA = 2;
	public readonly Quality_FXAA = 3;
	public readonly Fast_NFAA = 4;
	public readonly Standard_DLAA = 5;
	public readonly Quality_SMAA = 6;

	protected _getPropertyNames(): string[] {
		return ['Defaults', 'Disabled', 'Fast_FXAA', 'Standard_FXAA', 'Quality_FXAA', 'Fast_NFAA', 'Standard_DLAA',
			'Quality_SMAA'];
	}
}

export class PhysicsSet extends VbsApi {
	public readonly Disable = 0;
	public readonly Set1 = 1;
	public readonly Set2 = 2;
	public readonly Set3 = 3;
	public readonly Set4 = 4;
	public readonly Set5 = 5;
	public readonly Set6 = 6;
	public readonly Set7 = 7;
	public readonly Set8 = 8;

	protected _getPropertyNames(): string[] {
		return ['Disable', 'Set1', 'Set2', 'Set3', 'Set4', 'Set5', 'Set6', 'Set7', 'Set8'];
	}
}

export class TargetType extends VbsApi {
	public readonly DropTargetBeveled = 1;
	public readonly DropTargetSimple = 2;
	public readonly HitTargetRound = 3;
	public readonly HitTargetRectangle = 4;
	public readonly HitFatTargetRectangle = 5;
	public readonly HitFatTargetSquare = 6;
	public readonly DropTargetFlatSimple = 7;
	public readonly HitFatTargetSlim = 8;
	public readonly HitTargetSlim = 9;

	protected _getPropertyNames(): string[] {
		return ['DropTargetBeveled', 'DropTargetSimple', 'HitTargetRound', 'HitTargetRectangle', 'HitFatTargetRectangle',
			'HitFatTargetSquare', 'DropTargetFlatSimple', 'HitFatTargetSlim', 'HitTargetSlim'];
	}
}

export class GateType extends VbsApi {
	public readonly GateWireW = 1;
	public readonly GateWireRectangle = 2;
	public readonly GatePlate = 3;
	public readonly GateLongPlate = 4;

	protected _getPropertyNames(): string[] {
		return ['GateWireW', 'GateWireRectangle', 'GatePlate', 'GateLongPlate'];
	}
}

export class TextAlignment extends VbsApi {
	public readonly TextAlignLeft = 0;
	public readonly TextAlignCenter = 1;
	public readonly TextAlignRight = 2;

	protected _getPropertyNames(): string[] {
		return ['TextAlignLeft', 'TextAlignCenter', 'TextAlignRight'];
	}
}

export class DecalType extends VbsApi {
	public readonly DecalText = 0;
	public readonly DecalImage = 1;

	protected _getPropertyNames(): string[] {
		return ['DecalText', 'DecalImage'];
	}
}

export class SequencerState extends VbsApi {
	public readonly SeqUpOn = 1;
	public readonly SeqUpOff = 2;
	public readonly SeqDownOn = 3;
	public readonly SeqDownOff = 4;
	public readonly SeqRightOn = 5;
	public readonly SeqRightOff = 6;
	public readonly SeqLeftOn = 7;
	public readonly SeqLeftOff = 8;
	public readonly SeqDiagUpRightOn = 9;
	public readonly SeqDiagUpRightOff = 10;
	public readonly SeqDiagUpLeftOn = 11;
	public readonly SeqDiagUpLeftOff = 12;
	public readonly SeqDiagDownRightOn = 13;
	public readonly SeqDiagDownRightOff = 14;
	public readonly SeqDiagDownLeftOn = 15;
	public readonly SeqDiagDownLeftOff = 16;
	public readonly SeqMiddleOutHorizOn = 17;
	public readonly SeqMiddleOutHorizOff = 18;
	public readonly SeqMiddleInHorizOn = 19;
	public readonly SeqMiddleInHorizOff = 20;
	public readonly SeqMiddleOutVertOn = 21;
	public readonly SeqMiddleOutVertOff = 22;
	public readonly SeqMiddleInVertOn = 23;
	public readonly SeqMiddleInVertOff = 24;
	public readonly SeqStripe1HorizOn = 25;
	public readonly SeqStripe1HorizOff = 26;
	public readonly SeqStripe2HorizOn = 27;
	public readonly SeqStripe2HorizOff = 28;
	public readonly SeqStripe1VertOn = 29;
	public readonly SeqStripe1VertOff = 30;
	public readonly SeqStripe2VertOn = 31;
	public readonly SeqStripe2VertOff = 32;
	public readonly SeqHatch1HorizOn = 33;
	public readonly SeqHatch1HorizOff = 34;
	public readonly SeqHatch2HorizOn = 35;
	public readonly SeqHatch2HorizOff = 36;
	public readonly SeqHatch1VertOn = 37;
	public readonly SeqHatch1VertOff = 38;
	public readonly SeqHatch2VertOn = 39;
	public readonly SeqHatch2VertOff = 40;
	public readonly SeqCircleOutOn = 41;
	public readonly SeqCircleOutOff = 42;
	public readonly SeqCircleInOn = 43;
	public readonly SeqCircleInOff = 44;
	public readonly SeqClockRightOn = 45;
	public readonly SeqClockRightOff = 46;
	public readonly SeqClockLeftOn = 47;
	public readonly SeqClockLeftOff = 48;
	public readonly SeqRadarRightOn = 49;
	public readonly SeqRadarRightOff = 50;
	public readonly SeqRadarLeftOn = 51;
	public readonly SeqRadarLeftOff = 52;
	public readonly SeqWiperRightOn = 53;
	public readonly SeqWiperRightOff = 54;
	public readonly SeqWiperLeftOn = 55;
	public readonly SeqWiperLeftOff = 56;
	public readonly SeqFanLeftUpOn = 57;
	public readonly SeqFanLeftUpOff = 58;
	public readonly SeqFanLeftDownOn = 59;
	public readonly SeqFanLeftDownOff = 60;
	public readonly SeqFanRightUpOn = 61;
	public readonly SeqFanRightUpOff = 62;
	public readonly SeqFanRightDownOn = 63;
	public readonly SeqFanRightDownOff = 64;
	public readonly SeqArcBottomLeftUpOn = 65;
	public readonly SeqArcBottomLeftUpOff = 66;
	public readonly SeqArcBottomLeftDownOn = 67;
	public readonly SeqArcBottomLeftDownOff = 68;
	public readonly SeqArcBottomRightUpOn = 69;
	public readonly SeqArcBottomRightUpOff = 70;
	public readonly SeqArcBottomRightDownOn = 71;
	public readonly SeqArcBottomRightDownOff = 72;
	public readonly SeqArcTopLeftUpOn = 73;
	public readonly SeqArcTopLeftUpOff = 74;
	public readonly SeqArcTopLeftDownOn = 75;
	public readonly SeqArcTopLeftDownOff = 76;
	public readonly SeqArcTopRightUpOn = 77;
	public readonly SeqArcTopRightUpOff = 78;
	public readonly SeqArcTopRightDownOn = 79;
	public readonly SeqArcTopRightDownOff = 80;
	public readonly SeqScrewRightOn = 81;
	public readonly SeqScrewRightOff = 82;
	public readonly SeqScrewLeftOn = 83;
	public readonly SeqScrewLeftOff = 84;
	public readonly SeqLastDynamic = 85;
	public readonly SeqAllOff = 1000;
	public readonly SeqAllOn = 1001;
	public readonly SeqBlinking = 1002;
	public readonly SeqRandom = 1003;

	protected _getPropertyNames(): string[] {
		return ['SeqUpOn', 'SeqUpOff', 'SeqDownOn', 'SeqDownOff', 'SeqRightOn', 'SeqRightOff', 'SeqLeftOn',
			'SeqLeftOff', 'SeqDiagUpRightOn', 'SeqDiagUpRightOff', 'SeqDiagUpLeftOn', 'SeqDiagUpLeftOff',
			'SeqDiagDownRightOn', 'SeqDiagDownRightOff', 'SeqDiagDownLeftOn', 'SeqDiagDownLeftOff',
			'SeqMiddleOutHorizOn', 'SeqMiddleOutHorizOff', 'SeqMiddleInHorizOn', 'SeqMiddleInHorizOff',
			'SeqMiddleOutVertOn', 'SeqMiddleOutVertOff', 'SeqMiddleInVertOn', 'SeqMiddleInVertOff', 'SeqStripe1HorizOn',
			'SeqStripe1HorizOff', 'SeqStripe2HorizOn', 'SeqStripe2HorizOff', 'SeqStripe1VertOn', 'SeqStripe1VertOff',
			'SeqStripe2VertOn', 'SeqStripe2VertOff', 'SeqHatch1HorizOn', 'SeqHatch1HorizOff', 'SeqHatch2HorizOn',
			'SeqHatch2HorizOff', 'SeqHatch1VertOn', 'SeqHatch1VertOff', 'SeqHatch2VertOn', 'SeqHatch2VertOff',
			'SeqCircleOutOn', 'SeqCircleOutOff', 'SeqCircleInOn', 'SeqCircleInOff', 'SeqClockRightOn',
			'SeqClockRightOff', 'SeqClockLeftOn', 'SeqClockLeftOff', 'SeqRadarRightOn', 'SeqRadarRightOff',
			'SeqRadarLeftOn', 'SeqRadarLeftOff', 'SeqWiperRightOn', 'SeqWiperRightOff', 'SeqWiperLeftOn',
			'SeqWiperLeftOff', 'SeqFanLeftUpOn', 'SeqFanLeftUpOff', 'SeqFanLeftDownOn', 'SeqFanLeftDownOff',
			'SeqFanRightUpOn', 'SeqFanRightUpOff', 'SeqFanRightDownOn', 'SeqFanRightDownOff', 'SeqArcBottomLeftUpOn',
			'SeqArcBottomLeftUpOff', 'SeqArcBottomLeftDownOn', 'SeqArcBottomLeftDownOff', 'SeqArcBottomRightUpOn',
			'SeqArcBottomRightUpOff', 'SeqArcBottomRightDownOn', 'SeqArcBottomRightDownOff', 'SeqArcTopLeftUpOn',
			'SeqArcTopLeftUpOff', 'SeqArcTopLeftDownOn', 'SeqArcTopLeftDownOff', 'SeqArcTopRightUpOn',
			'SeqArcTopRightUpOff', 'SeqArcTopRightDownOn', 'SeqArcTopRightDownOff', 'SeqScrewRightOn',
			'SeqScrewRightOff', 'SeqScrewLeftOn', 'SeqScrewLeftOff', 'SeqLastDynamic', 'SeqAllOff', 'SeqAllOn',
			'SeqBlinking', 'SeqRandom'];
	}
}

export class SizingType extends VbsApi {
	public readonly AutoSize = 0;
	public readonly AutoWidth = 1;
	public readonly ManualSize = 2;

	protected _getPropertyNames(): string[] {
		return ['AutoSize', 'AutoWidth', 'ManualSize'];
	}
}

export class KickerType extends VbsApi {
	public readonly KickerInvisible = 0;
	public readonly KickerHole = 1;
	public readonly KickerCup = 2;
	public readonly KickerHoleSimple = 3;
	public readonly KickerWilliams = 4;
	public readonly KickerGottlieb = 5;
	public readonly KickerCup2 = 6;

	protected _getPropertyNames(): string[] {
		return ['KickerInvisible', 'KickerHole', 'KickerCup', 'KickerHoleSimple', 'KickerWilliams', 'KickerGottlieb',
			'KickerCup2'];
	}
}

export class RampImageAlignment extends VbsApi {
	public readonly ImageModeWorld = 0;
	public readonly ImageModeWrap = 1;

	protected _getPropertyNames(): string[] {
		return ['ImageModeWorld', 'ImageModeWrap'];
	}
}

export class VBColors extends VbsApi {
	public readonly vbBlack = 0x00;
	public readonly vbRed = 0xFF;
	public readonly vbGreen = 0xFF00;
	public readonly vbYellow = 0xFFFF;
	public readonly vbBlue = 0xFF0000;
	public readonly vbMagenta = 0xFF00FF;
	public readonly vbCyan = 0xFFFF00;
	public readonly vbWhite = 0xFFFFFF;

	protected _getPropertyNames(): string[] {
		return ['vbBlack', 'vbRed', 'vbGreen', 'vbYellow', 'vbBlue', 'vbMagenta', 'vbCyan', 'vbWhite'];
	}
}

export class VBComparison extends VbsApi {
	public readonly vbBinaryCompare = 0;
	public readonly vbTextCompare = 1;

	protected _getPropertyNames(): string[] {
		return ['vbBinaryCompare', 'vbTextCompare'];
	}
}

export class VBDateTime extends VbsApi {
	public readonly vbSunday = 1;
	public readonly vbMonday = 2;
	public readonly vbTuesday = 3;
	public readonly vbWednesday = 4;
	public readonly vbThursday = 5;
	public readonly vbFriday = 6;
	public readonly vbSaturday = 7;
	public readonly vbUseSystem = 0;
	public readonly vbUseSystemDayOfWeek = 0;
	public readonly vbFirstJan1 = 1;
	public readonly vbFirstFourDays = 2;
	public readonly vbFirstFullWeek = 3;

	protected _getPropertyNames(): string[] {
		return ['vbSunday', 'vbMonday', 'vbTuesday', 'vbWednesday', 'vbThursday', 'vbFriday', 'vbSaturday',
			'vbUseSystem', 'vbUseSystemDayOfWeek', 'vbFirstJan1', 'vbFirstFourDays', 'vbFirstFullWeek'];
	}
}

export class VBMsgBox extends VbsApi {
	public readonly vbGeneralDate = 0;
	public readonly vbLongDate = 1;
	public readonly vbShortDate = 2;
	public readonly vbLongTime = 3;
	public readonly vbShortTime = 4;

	protected _getPropertyNames(): string[] {
		return ['vbGeneralDate', 'vbLongDate', 'vbShortDate', 'vbLongTime', 'vbShortTime'];
	}
}

export class VBDateFormat extends VbsApi {
	public readonly vbOKOnly = 0;
	public readonly vbOKCancel = 1;
	public readonly vbAbortRetryIgnore = 2;
	public readonly vbYesNoCancel = 3;
	public readonly vbYesNo = 4;
	public readonly vbRetryCancel = 5;
	public readonly vbCritical = 16;
	public readonly vbQuestion = 32;
	public readonly vbExclamation = 48;
	public readonly vbInformation = 64;
	public readonly vbDefaultButton1 = 0;
	public readonly vbDefaultButton2 = 256;
	public readonly vbDefaultButton3 = 512;
	public readonly vbDefaultButton4 = 768;
	public readonly vbApplicationModal = 0;
	public readonly vbSystemModal = 4096;

	protected _getPropertyNames(): string[] {
		return ['vbOKOnly', 'vbOKCancel', 'vbAbortRetryIgnore', 'vbYesNoCancel', 'vbYesNo', 'vbRetryCancel',
			'vbCritical', 'vbQuestion', 'vbExclamation', 'vbInformation', 'vbDefaultButton1', 'vbDefaultButton2',
			'vbDefaultButton3', 'vbDefaultButton4', 'vbApplicationModal', 'vbSystemModal'];
	}
}

export class VBMsgBoxReturn extends VbsApi {
	public readonly vbOK = 1;
	public readonly vbCancel = 2;
	public readonly vbAbort = 3;
	public readonly vbRetry = 4;
	public readonly vbIgnore = 5;
	public readonly vbYes = 6;
	public readonly vbNo = 7;

	protected _getPropertyNames(): string[] {
		return ['vbOK', 'vbCancel', 'vbAbort', 'vbRetry', 'vbIgnore', 'vbYes', 'vbNo'];
	}
}

export class VBTriState extends VbsApi {
	public readonly vbUseDefault = -2;
	public readonly vbTrue = -1;
	public readonly vbFalse = 0;

	protected _getPropertyNames(): string[] {
		return ['vbUseDefault', 'vbTrue', 'vbFalse'];
	}
}

export class VBVarType extends VbsApi {
	public readonly vbEmpty = 0;
	public readonly vbNull = 1;
	public readonly vbInteger = 2;
	public readonly vbLong = 3;
	public readonly vbSingle = 4;
	public readonly vbDouble = 5;
	public readonly vbCurrency = 6;
	public readonly vbDate = 7;
	public readonly vbString = 8;
	public readonly vbObject = 9;
	public readonly vbError = 10;
	public readonly vbBoolean = 11;
	public readonly vbVariant = 12;
	public readonly vbDataObject = 13;
	public readonly vbDecimal = 14;
	public readonly vbByte = 17;
	public readonly vbArray = 8192;

	protected _getPropertyNames(): string[] {
		return ['vbEmpty', 'vbNull', 'vbInteger', 'vbLong', 'vbSingle', 'vbDouble', 'vbCurrency', 'vbDate', 'vbString',
			'vbObject', 'vbError', 'vbBoolean', 'vbVariant', 'vbDataObject', 'vbDecimal', 'vbByte', 'vbArray'];
	}
}

export class EnumsApi extends VbsApi {

	public LightStatus = new LightStatus();
	public BackglassIndex = new BackglassIndex();
	public Filters = new Filters();
	public ImageAlignment = new ImageAlignment();
	public Shape = new Shape();
	public TriggerShape = new TriggerShape();
	public RampType = new RampType();
	public PlungerType = new PlungerType();
	public UserDefaultOnOff = new UserDefaultOnOff();
	public FXAASettings = new FXAASettings();
	public PhysicsSet = new PhysicsSet();
	public TargetType = new TargetType();
	public GateType = new GateType();
	public TextAlignment = new TextAlignment();
	public DecalType = new DecalType();
	public SequencerState = new SequencerState();
	public SizingType = new SizingType();
	public KickerType = new KickerType();
	public RampImageAlignment = new RampImageAlignment();
	public VBColors = new VBColors();
	public VBComparison = new VBComparison();
	public VBDateTime = new VBDateTime();
	public VBMsgBox = new VBMsgBox();
	public VBDateFormat = new VBDateFormat();
	public VBMsgBoxReturn = new VBMsgBoxReturn();
	public VBTriState = new VBTriState();
	public VBVarType = new VBVarType();

	protected _getPropertyNames(): string[] {
		return ['LightStatus', 'BackglassIndex', 'Filters', 'ImageAlignment', 'Shape', 'TriggerShape', 'RampType',
			'PlungerType', 'UserDefaultOnOff', 'FXAASettings', 'PhysicsSet', 'TargetType', 'GateType', 'TextAlignment',
			'SequencerState', 'SizingType', 'KickerType', 'RampImageAlignment', 'VBColors', 'VBComparison',
			'VBDateTime', 'VBMsgBox', 'VBDateFormat', 'VBMsgBoxReturn', 'VBTriState', 'VBVarType'];
	}
}

export const Enums = new EnumsApi();
