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

import { IAnimation } from '../../game/ianimatable';
import { PlayerPhysics } from '../../game/player-physics';
import { Table } from '../table/table';
import { Trigger } from './trigger';
import { TriggerData } from './trigger-data';
import { TriggerState } from './trigger-state';

export class TriggerAnimation implements IAnimation {

	private readonly data: TriggerData;
	private readonly state: TriggerState;

	public hitEvent = false;
	public unhitEvent = false;

	private timeMsec = 0;
	private doAnimation: boolean = false;
	private moveDown: boolean = false;

	constructor(data: TriggerData, state: TriggerState) {
		this.data = data;
		this.state = state;
	}

	public init(): void {
		// nothing to init.
	}

	public triggerAnimationHit(): void {
		this.hitEvent = true;
	}

	public triggerAnimationUnhit(): void {
		this.unhitEvent = true;
	}

	public updateAnimation(physics: PlayerPhysics, table: Table) {
		const oldTimeMsec = (this.timeMsec < physics.timeMsec) ? this.timeMsec : physics.timeMsec;
		this.timeMsec = physics.timeMsec;
		const diffTimeMsec = physics.timeMsec - oldTimeMsec;

		let animLimit = this.data.shape === Trigger.ShapeTriggerStar ? this.data.radius * (1.0 / 5.0) : 32.0;
		if (this.data.shape === Trigger.ShapeTriggerButton) {
			animLimit = this.data.radius * (1.0 / 10.0);
		}
		if (this.data.shape === Trigger.ShapeTriggerWireC) {
			animLimit = 60.0;
		}
		if (this.data.shape === Trigger.ShapeTriggerWireD) {
			animLimit = 25.0;
		}

		const limit = animLimit * table.getScaleZ();

		if (this.hitEvent) {
			this.doAnimation = true;
			this.hitEvent = false;
			// unhitEvent = false;   // Bugfix: If HitEvent and unhitEvent happen at the same time, you want to favor the unhit, otherwise the switch gets stuck down.
			this.state.heightOffset = 0.0;
			this.moveDown = true;
		}
		if (this.unhitEvent) {
			this.doAnimation = true;
			this.unhitEvent = false;
			this.hitEvent = false;
			this.state.heightOffset = limit;
			this.moveDown = false;
		}

		if (this.doAnimation) {
			let step = diffTimeMsec * this.data.animSpeed * table.getScaleZ();
			if (this.moveDown) {
				step = -step;
			}
			this.state.heightOffset += step;

			if (this.moveDown) {
				if (this.state.heightOffset <= -limit) {
					this.state.heightOffset = -limit;
					this.doAnimation = false;
					this.moveDown = false;
				}

			} else {
				if (this.state.heightOffset >= 0.0) {
					this.state.heightOffset = 0.0;
					this.doAnimation = false;
					this.moveDown = true;
				}
			}
		}
	}
}
