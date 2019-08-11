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

import { IPlayable } from '../game/iplayable';

/* tslint:disable:no-console */
export class FireEvents {

	/**
	 * while playing and the ball hits the mesh the hit threshold is updated here
	 */
	public currentHitThreshold: number = 0;

	private readonly playable: IPlayable;

	constructor(playable: IPlayable) {
		this.playable = playable;
	}

	public fireGroupEvent(e: FireEvent): void {
		console.log('[%s] fireGroupEvent(%s)', this.playable.getName(), e);
	}

	public fireVoidEventParm(e: FireEvent, data: number): void {
		console.log('[%s] fireGroupEvent(%s, %s)', this.playable.getName(), e, data);
	}
}

export enum FireEvent {

	// Table
	GameEventsKeyDown = 1000,
	GameEventsKeyUp = 1001,
	GameEventsInit = 1002,
	GameEventsMusicDone = 1003,
	GameEventsExit = 1004,
	GameEventsPaused = 1005,
	GameEventsUnPaused = 1006,

	// Surface
	SurfaceEventsSlingshot = 1101,

	// Flipper
	FlipperEventsCollide = 1200,

	// Timer
	TimerEventsTimer = 1300,

	// Spinner
	SpinnerEventsSpin = 1301,

	// HitTarget
	TargetEventsDropped = 1302,
	TargetEventsRaised = 1303,

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
	HitEventsHit = 1400,
	HitEventsUnhit = 1401,
	LimitEventsEOS = 1402,
	LimitEventsBOS = 1403,
}
