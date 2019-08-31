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

import { EventProxy } from '../../game/event-proxy';
import { IBallCreationPosition, PlayerPhysics } from '../../game/player-physics';
import { Ball } from '../ball/ball';
import { ItemApi } from '../item-api';
import { Table } from '../table/table';
import { PlungerData } from './plunger-data';
import { PlungerHit } from './plunger-hit';
import { Player } from '../../game/player';

export class PlungerApi extends ItemApi {

	private readonly data: PlungerData;
	private readonly hit: PlungerHit;
	private readonly events: EventProxy;
	private readonly ballCreator: IBallCreationPosition;

	constructor(data: PlungerData, hit: PlungerHit, events: EventProxy, ballCreator: IBallCreationPosition, player: Player, table: Table) {
		super(player, table);
		this.data = data;
		this.hit = hit;
		this.events = events;
		this.ballCreator = ballCreator;
	}

	// from IEditable
	get Name() { return this.data.wzName; }
	set Name(v) { this.data.wzName = v; }
	get TimerInterval() { return this.data.timer.interval; }
	set TimerInterval(v) { this.data.timer.interval = v; }
	get TimerEnabled() { return this.data.timer.enabled; }
	set TimerEnabled(v) { this.data.timer.enabled = v; }
	public UserValue: any;

	// from Plunger
	get X() { return this.data.center.x; }
	set X(v) { this.data.center.x = v; }
	get Y() { return this.data.center.y; }
	set Y(v) { this.data.center.y = v; }
	get Width() { return this.data.width; }
	set Width(v) { this.data.width = v; }
	get ZAdjust() { return this.data.zAdjust; }
	set ZAdjust(v) { this.data.zAdjust = v; }
	get Surface() { return this.data.szSurface; }
	set Surface(v) { this.data.szSurface = v; }
	get MechStrength() { return this.data.mechStrength; }
	set MechStrength(v) { this.data.mechStrength = v; }
	get MechPlunger() { return this.data.mechPlunger; }
	set MechPlunger(v) { this.data.mechPlunger = v; }
	get AutoPlunger() { return this.data.autoPlunger; }
	set AutoPlunger(v) { this.data.autoPlunger = v; }
	get Visible() { return this.data.isVisible; }
	set Visible(v) { this.data.isVisible = v; }
	get ParkPosition() { return this.data.parkPosition; }
	set ParkPosition(v) { this.data.parkPosition = v; }
	get Stroke() { return this.data.stroke; }
	set Stroke(v) { this.data.stroke = v; }
	get ScatterVelocity() { return this.data.scatterVelocity; }
	set ScatterVelocity(v) { this.data.scatterVelocity = v; }
	get MomentumXfer() { return this.data.momentumXfer; }
	set MomentumXfer(v) { this.data.momentumXfer = v; }
	get ReflectionEnabled() { return this.data.isReflectionEnabled; }
	set ReflectionEnabled(v) { this.data.isReflectionEnabled = v; }
	get PullSpeed() { return this.data.speedPull; }
	set PullSpeed(v) { this.data.speedPull = v; }
	get FireSpeed() { return this.data.speedFire; }
	set FireSpeed(v) { this.data.speedFire = v; }
	get Type() { return this.data.type; }
	set Type(v) { this.data.type = v; }
	get Material() { return this.data.szMaterial; }
	set Material(v) { this.data.szMaterial = v; }
	get Image() { return this.data.szImage; }
	set Image(v) { this.assertNonHdrImage(v); this.data.szImage = v; }
	get AnimFrames() { return this.data.animFrames; }
	set AnimFrames(v) { this.data.animFrames = v; }
	get TipShape() { return this.data.szTipShape; }
	set TipShape(v) { this.data.szTipShape = v; }
	get RodDiam() { return this.data.rodDiam; }
	set RodDiam(v) { this.data.rodDiam = v; }
	get RingGap() { return this.data.ringGap; }
	set RingGap(v) { this.data.ringGap = v; }
	get RingDiam() { return this.data.ringDiam; }
	set RingDiam(v) { this.data.ringDiam = v; }
	get RingWidth() { return this.data.ringWidth; }
	set RingWidth(v) { this.data.ringWidth = v; }
	get SpringDiam() { return this.data.springDiam; }
	set SpringDiam(v) { this.data.springDiam = v; }
	get SpringGauge() { return this.data.springGauge; }
	set SpringGauge(v) { this.data.springGauge = v; }
	get SpringLoops() { return this.data.springLoops; }
	set SpringLoops(v) { this.data.springLoops = v; }
	get SpringEndLoops() { return this.data.springEndLoops; }
	set SpringEndLoops(v) { this.data.springEndLoops = v; }

	/**
	 * Initiate a pull; the speed is set by our pull speed property.
	 */
	public PullBack(): void {
		this.hit.getMoverObject().pullBack(this.data.speedPull);
	}

	/**
	 * Fires the plunger.
	 */
	public Fire(): void {
		// check for an auto plunger
		if (this.data.autoPlunger) {
			// Auto Plunger - this models a "Launch Ball" button or a
			// ROM-controlled launcher, rather than a player-operated
			// spring plunger.  In a physical machine, this would be
			// implemented as a solenoid kicker, so the amount of force
			// is constant (modulo some mechanical randomness).  Simulate
			// this by triggering a release from the maximum retracted
			// position.
			this.hit.getMoverObject().fire(1.0);

		} else {
			// Regular plunger - trigger a release from the current
			// position, using the keyboard firing strength.
			this.hit.getMoverObject().fire();
		}
	}

	/**
	 * Creates a new ball on the plunger's tip.
	 */
	public CreateBall(): Ball {
		return this.player.createBall(this.ballCreator);
	}

	/**
	 * Returns the plunger position.
	 * @return Position between 0 and 25.
	 */
	public Position(): number  {
		const frame = (this.hit.getMoverObject().pos - this.hit.getMoverObject().frameStart)
			/ (this.hit.getMoverObject().frameEnd - this.hit.getMoverObject().frameStart);

		return 25.0 - saturate(frame) * 25;
	}

	/**
	 * Returns the type of physical plunger, but on the web this is always 0.
	 */
	public MotionDevice(): number {
		// there is no motion device support here.
		return 0;
	}

	/**
	 * No idea wtf this is supposed to do.
	 */
	public InterfaceSupportsErrorInfo(riid: any): boolean {
		return false;
	}
}

function saturate(n: number) {
	if (n < 0) {
		return 0;
	} else if (n > 1) {
		return 1;
	} else {
		return n;
	}
}
