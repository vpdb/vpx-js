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

export enum Event {

	// Table
	GameEventsKeyDown = 1000, // DISPID_GameEvents_KeyDown
	GameEventsKeyUp = 1001, // DISPID_GameEvents_KeyUp
	GameEventsInit = 1002, // DISPID_GameEvents_Init
	GameEventsMusicDone = 1003, // DISPID_GameEvents_MusicDone
	GameEventsExit = 1004, // DISPID_GameEvents_Exit
	GameEventsPaused = 1005, // DISPID_GameEvents_Paused
	GameEventsUnPaused = 1006, // DISPID_GameEvents_UnPaused

	// Surface
	SurfaceEventsSlingshot = 1101, // DISPID_SurfaceEvents_Slingshot

	// Flipper
	FlipperEventsCollide = 1200, // DISPID_FlipperEvents_Collide

	// Timer
	TimerEventsTimer = 1300, // DISPID_TimerEvents_Timer

	// Spinner
	SpinnerEventsSpin = 1301, // DISPID_SpinnerEvents_Spin

	// HitTarget
	TargetEventsDropped = 1302, // DISPID_TargetEvents_Dropped
	TargetEventsRaised = 1303,  // DISPID_TargetEvents_Raised

	// Light Sequencer
	LightSeqEventsPlayDone = 1320,

	// Plunger
	// PluFrames = 464,
	// Width = 465,
	// ZAdjust = 466,
	//
	// RodDiam = 467,
	// RingDiam = 468,
	// RingThickness = 469,
	// SpringDiam = 470,
	// TipShape = 471,
	// SpringGauge = 472,
	// SpringLoops = 473,
	// RingGap = 474,
	// SpringEndLoops = 475,

	// Generic
	HitEventsHit = 1400, // DISPID_HitEvents_Hit
	HitEventsUnhit = 1401, // DISPID_HitEvents_Unhit
	LimitEventsEOS = 1402, // DISPID_LimitEvents_EOS
	LimitEventsBOS = 1403, // DISPID_LimitEvents_BOS
}
