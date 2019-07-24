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
import { CollisionType } from '../../physics/collision-type';
import { HitObject } from '../../physics/hit-object';
import { Table } from '../table';
import { Plunger, PlungerConfig } from './plunger';
import { PlungerData } from './plunger-data';
import { PlungerMover } from './plunger-mover';

export class PlungerHit extends HitObject {

	private readonly plungerMover: PlungerMover;

	constructor(plungerData: PlungerData, cFrames: number, player: Player, table: Table) {
		super();
		const zHeight = table.getSurfaceHeight(plungerData.szSurface, plungerData.center.x, plungerData.center.y);
		const config: PlungerConfig = {
			x: plungerData.center.x - plungerData.width,
			y: plungerData.center.y + plungerData.height,
			x2: plungerData.center.x + plungerData.width,
			zHeight,
			frameTop: plungerData.center.y - plungerData.stroke!,
			frameBottom: plungerData.center.y,
			cFrames,
		};

		this.hitBBox.zlow = config.zHeight;
		this.hitBBox.zhigh = config.zHeight + Plunger.PLUNGER_HEIGHT;

		this.plungerMover = new PlungerMover(config, plungerData, player, table.data!);
	}

	public calcHitBBox(): void {
		// Allow roundoff
		this.hitBBox.left = this.plungerMover.x - 0.1;
		this.hitBBox.right = this.plungerMover.x2 + 0.1;
		this.hitBBox.top = this.plungerMover.frameEnd - 0.1;
		this.hitBBox.bottom = this.plungerMover.y + 0.1;

		// zlow & zhigh gets set in constructor
	}

	public getMoverObject(): PlungerMover {
		return this.plungerMover;
	}

	public getType(): CollisionType {
		return CollisionType.Plunger;
	}
}
