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

import { Table } from '../..';
import { IAnimation } from '../../game/ianimatable';
import { Player } from '../../game/player';
import { BumperData } from './bumper-data';
import { BumperHit } from './bumper-hit';
import { BumperState } from './bumper-state';

export class BumperAnimation implements IAnimation {

	private readonly data: BumperData;
	private readonly state: BumperState;
	private readonly hit: BumperHit;

	private timeMsec: number = 0;
	private ringAnimate: boolean = false;
	private ringDown: boolean = false;
	private doSkirtAnimation: boolean = false;
	private skirtCounter: number = 0;

	public enableSkirtAnimation: boolean = true;

	constructor(data: BumperData, state: BumperState, hit: BumperHit) {
		this.data = data;
		this.state = state;
		this.hit = hit;
	}

	public init(player: Player): void {
		this.timeMsec = player.timeMsec;
	}

	public updateAnimation(player: Player, table: Table): void {

		const oldTimeMsec = this.timeMsec < player.timeMsec ? this.timeMsec : player.timeMsec;
		this.timeMsec = player.timeMsec;
		const diffTimeMsec = (player.timeMsec - oldTimeMsec);

		const state = this.hit.animHitEvent ? 1 : 0;    // 0 = not hit, 1 = hit

		if (this.data.isRingVisible) {
			const limit = this.data.ringDropOffset + (this.data.heightScale * 0.5) * table.getScaleZ();

			if (state === 1) {
				this.ringAnimate = true;
				this.ringDown = true;
				this.hit.animHitEvent = false;
			}

			if (this.ringAnimate) {
				let step = this.data.ringSpeed * table.getScaleZ();
				if (this.ringDown) {
					step = -step;
				}
				this.state.ringOffset += step * diffTimeMsec;
				if (this.ringDown) {
					if (this.state.ringOffset <= -limit) {
						this.state.ringOffset = -limit;
						this.ringDown = false;
					}

				} else {
					if (this.state.ringOffset >= 0.0) {
						this.state.ringOffset = 0.0;
						this.ringAnimate = false;
					}
				}
			}

			if (this.data.isSkirtVisible) {
				if (this.enableSkirtAnimation) {
					if (state === 1) {
						this.doSkirtAnimation = true;
						//UpdateSkirt(true);
						this.skirtCounter = 0.0;
					}
					if (this.doSkirtAnimation) {
						this.skirtCounter += diffTimeMsec;
						if (this.skirtCounter > 160.0) {
							this.doSkirtAnimation = false;
							//UpdateSkirt(false);
						}
					}
				}
			}
		}
	}
}
