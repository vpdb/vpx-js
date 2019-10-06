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
import { Player } from '../../game/player';
import { degToRad, radToDeg } from '../../math/float';
import { clamp } from '../../math/functions';
import { PHYS_FACTOR } from '../../physics/constants';
import { ItemApi } from '../item-api';
import { Table } from '../table/table';
import { SpinnerData } from './spinner-data';
import { SpinnerMover } from './spinner-mover';
import { SpinnerState } from './spinner-state';

export class SpinnerApi extends ItemApi<SpinnerData> {

	private readonly state: SpinnerState;
	private readonly mover: SpinnerMover;

	constructor(state: SpinnerState, mover: SpinnerMover, data: SpinnerData, events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
		this.state = state;
		this.mover = mover;
	}

	get Length() { return this.data.length; }
	set Length(v) { this.data.length = v; }
	get Rotation() { return this.data.rotation; }
	set Rotation(v) { this.data.rotation = v; }
	get Height() { return this.data.height; }
	set Height(v) { this.data.height = v; }
	get Damping() { return Math.pow(this.mover.damping, 1.0 / PHYS_FACTOR); }
	set Damping(v) { this.mover.damping = Math.pow(clamp(v, 0.0, 1.0), PHYS_FACTOR); }
	get Material() { return this.data.szMaterial; }
	set Material(v) { this.data.szMaterial = v; }
	get Image() { return this.data.szImage; }
	set Image(v) { this._assertNonHdrImage(v); this.data.szImage = v; }
	get X() { return this.data.center.x; }
	set X(v) { this.data.center.x = v; }
	get Y() { return this.data.center.y; }
	set Y(v) { this.data.center.y = v; }
	get Surface() { return this.data.szSurface; }
	set Surface(v) { this.data.szSurface = v; }
	get ShowBracket() { return this.data.showBracket; }
	set ShowBracket(v) { this.data.showBracket = v; }
	get AngleMax() { return radToDeg(this.mover.angleMax); }
	set AngleMax(v) {
		if (this.data.angleMin !== this.data.angleMax) {             // allow only if in limited angle mode
			v = clampAngleToRad(v, this.data.angleMin, this.data.angleMax);
			if (this.mover.angleMin < v) {                           // Min is smaller???
				this.mover.angleMax = v;                             // yes set new max
			} else {
				this.mover.angleMin = v;                             // no set new minumum
			}
		}
	}
	get AngleMin() { return radToDeg(this.mover.angleMin); }
	set AngleMin(v) {
		if (this.data.angleMin !== this.data.angleMax) {             // allow only if in limited angle mode
			v = clampAngleToRad(v, this.data.angleMin, this.data.angleMax);
			if (this.mover.angleMax > v) {                           // max is bigger
				this.mover.angleMin = v;                             // then set new minumum
			} else {
				this.mover.angleMax = v;                             // else set new max
			}
		}
	}
	get Elasticity() { return this.mover.elasticity; }
	set Elasticity(v) { this.mover.elasticity = v; }
	get Visible() { return this.mover.isVisible; }
	set Visible(v) { this.mover.isVisible = v; }
	get ReflectionEnabled() { return this.data.isReflectionEnabled; }
	set ReflectionEnabled(v) { this.data.isReflectionEnabled = v; }
	get CurrentAngle() { return this.state.angle; }
}

function clampAngleToRad(angle: number, angleMin: number, angleMax: number): number {
	if (angle > angleMax) {
		angle = angleMax;
	} else if (angle < angleMin) {
		angle = angleMin;
	}
	return degToRad(angle);
}
