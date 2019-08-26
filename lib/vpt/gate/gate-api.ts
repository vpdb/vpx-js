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

import { Player } from '../../game/player';
import { degToRad } from '../../math/float';
import { clamp } from '../../math/functions';
import { PHYS_FACTOR } from '../../physics/constants';
import { LineSeg } from '../../physics/line-seg';
import { ItemApi } from '../item-api';
import { Table } from '../table/table';
import { GateData } from './gate-data';
import { GateHit } from './gate-hit';
import { GateMover } from './gate-mover';
import { GateState } from './gate-state';

export class GateApi extends ItemApi {

	private readonly data: GateData;
	private readonly state: GateState;
	private readonly mover: GateMover;
	private readonly hitGate: GateHit;
	private readonly hitLine: LineSeg | null;

	constructor(data: GateData, state: GateState, mover: GateMover, hitGate: GateHit, hitLine: LineSeg | null, player: Player, table: Table) {
		super(player, table);
		this.data = data;
		this.state = state;
		this.mover = mover;
		this.hitGate = hitGate;
		this.hitLine = hitLine;
	}

	// from IEditable
	get Name() { return this.data.wzName; }
	set Name(v) { this.data.wzName = v; }
	get TimerInterval() { return this.data.timer.interval; }
	set TimerInterval(v) { this.data.timer.interval = v; }
	get TimerEnabled() { return this.data.timer.enabled; }
	set TimerEnabled(v) { this.data.timer.enabled = v; }
	public UserValue: any;

	// from Gate
	get Length() { return this.data.length; }
	set Length(v) { this.data.length = v; }
	get Height() { return this.data.height; }
	set Height(v) { this.data.height = v; }
	get Rotation() { return this.data.rotation; }
	set Rotation(v) { this.data.rotation = v; }
	get X() { return this.data.vCenter.x; }
	set X(v) { this.data.vCenter.x = v; }
	get Y() { return this.data.vCenter.y; }
	set Y(v) { this.data.vCenter.y = v; }
	get Surface() { return this.data.szSurface; }
	set Surface(v) { this.data.szSurface = v; }
	get Material() { return this.data.szMaterial; }
	set Material(v) { this.data.szMaterial = v; }
	get Open() { return this.mover.open; }
	set Open(v) { this.openGate(v); }
	get Elasticity() { return this.data.elasticity; }
	set Elasticity(v) { this.data.elasticity = v; }
	get ShowBracket() { return this.data.showBracket; }
	set ShowBracket(v) { this.data.showBracket = v; }
	get CloseAngle() { return this.mover.angleMin; }
	set CloseAngle(v) { this.setCloseAngle(v); }
	get OpenAngle() { return this.mover.angleMax; }
	set OpenAngle(v) { this.setOpenAngle(v); }
	get Collidable() { return this.hitGate.isEnabled; }
	set Collidable(v) { this.setCollidable(v); }
	get Friction() { return this.mover.friction; }
	set Friction(v) { this.mover.friction = clamp(v, 0.0, 1.0); }
	get Damping() { return Math.pow(this.mover.damping, 1.0 / PHYS_FACTOR); }
	set Damping(v) { this.mover.damping = this.mover.damping = Math.pow(clamp(v, 0, 1), PHYS_FACTOR); }
	get GravityFactor() { return this.mover.gravityFactor; }
	set GravityFactor(v) { this.mover.gravityFactor = clamp(v, 0, 1); }
	get Visible() { return this.mover.isVisible; }
	set Visible(v) { this.mover.isVisible = v; }
	get TwoWay() { return this.data.twoWay; }
	set TwoWay(v) { this.data.twoWay = v; }
	get ReflectionEnabled() { return this.data.isReflectionEnabled; }
	set ReflectionEnabled(v) { this.data.isReflectionEnabled = v; }
	get CurrentAngle() { return this.state.angle; }
	get DrawStyle() { return this.data.gateType; }
	set DrawStyle(v) { this.data.gateType = v; }

	private openGate(isOpen: boolean): void {
		this.mover.angleMax = this.data.angleMax;
		this.mover.angleMin = this.data.angleMin;
		this.mover.forcedMove = true;

		if (isOpen) {
			this.mover.open = true;
			this.hitGate.isEnabled = false;
			if (this.hitLine) {
				this.hitLine.isEnabled = false;
			}

			if (this.state.angle < this.mover.angleMax) {
				this.mover.angleSpeed = 0.2;
			}

		} else {
			this.mover.open = false;
			this.hitGate.isEnabled = this.data.isCollidable;
			if (this.hitLine) {
				this.hitLine.isEnabled = this.data.isCollidable;
			}

			if (this.state.angle > this.mover.angleMin) {
				this.mover.angleSpeed = -0.2;
			}
		}
	}

	private setCloseAngle(angleDeg: number): void {
		if (this.data.isCollidable) {
			throw new Error("Gate is collidable! closing angles other than 0 aren't possible!");
		}
		let angle = degToRad(angleDeg);

		if (angle > this.data.angleMax) {
			angle = this.data.angleMax;
		} else if (angle < this.data.angleMin) {
			angle = this.data.angleMin;
		}

		if (this.mover.angleMax > angle) {      // max is bigger
			this.mover.angleMin = angle;
		} else {
			this.mover.angleMax = angle;        // else set new max
		}
	}

	private setOpenAngle(newVal: number): void {
		if (this.data.isCollidable) {
			throw new Error("Gate is collidable! open angles other than 90 aren't possible!");
		} else {
			newVal = degToRad(newVal);
		}
		if (newVal > this.data.angleMax) {
			newVal = this.data.angleMax;
		} else if (newVal < this.data.angleMin) {
			newVal = this.data.angleMin;
		}
		if (this.mover.angleMin < newVal) {      // min is smaller
			this.mover.angleMax = newVal;
		} else {
			this.mover.angleMin = newVal;        // else set new min
		}
	}

	private setCollidable(newVal: boolean): void {
		this.hitGate.isEnabled = newVal;
		if (this.hitLine) {
			this.hitLine.isEnabled = newVal;
		}
		this.mover.angleMax = this.data.angleMax;
		this.mover.angleMin = this.data.angleMin;

		if (newVal) {
			this.mover.angleMin = 0;
		}
	}

	public move(dir: number, speed: number, angle: number) {
		this.mover.forcedMove = true;
		this.mover.open = true;                            // move always turns off natural swing
		this.hitGate.isEnabled = false;                    // and collidable off
		if (this.hitLine) {
			this.hitLine.isEnabled = false;
		}

		if (speed <= 0.0) {
			speed = 0.2;
		} else {
			speed *= Math.PI / 180.0;                      // convert to radians
		}

		if (!dir || angle !== 0) {
			angle *= Math.PI / 180.0;                      // convert to radians

			if (angle < this.data.angleMin) {
				angle = this.data.angleMin;
			} else if (angle > this.data.angleMax) {
				angle = this.data.angleMax;
			}

			const da = angle - this.state.angle;           // calc true direction

			if (da > 1.0e-5) {
				dir = +1;
			} else if (da < -1.0e-5) {
				dir = -1;
			} else {
				dir = 0;                                   // do nothing
				this.mover.angleSpeed = 0;                 // stop
			}
		} else {
			angle = (dir < 0) ? this.data.angleMin : this.data.angleMax;       // dir selected and angle not specified
		}

		if (dir > 0) {
			this.mover.angleMax = angle;

			if (this.state.angle < this.mover.angleMax) {
				this.mover.angleSpeed = speed;
			}

		} else if (dir < 0) {
			this.mover.angleMin = angle;
			if (this.state.angle > this.mover.angleMin) {
				this.mover.angleSpeed = -speed;
			}
		}
	}
}
