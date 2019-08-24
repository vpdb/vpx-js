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
import { CollisionEvent } from '../../physics/collision-event';
import { FireEvent, FireEvents } from '../../physics/fire-events';
import { HitCircle } from '../../physics/hit-circle';
import { BumperAnimation } from './bumper-animation';
import { BumperData } from './bumper-data';
import { BumperState } from './bumper-state';

export class BumperHit extends HitCircle<FireEvents> {

	private readonly data: BumperData;
	private readonly state: BumperState;
	private readonly animation: BumperAnimation;
	private readonly events: FireEvents;

	constructor(data: BumperData, state: BumperState, animation: BumperAnimation, events: FireEvents, height: number) {
		super(data.vCenter, data.radius, height, height + data.heightScale);
		this.data = data;
		this.state = state;
		this.animation = animation;
		this.animation.hitEvent = this.data.hitEvent;

		this.events = events;
		this.isEnabled = this.data.isCollidable;
		this.scatter = this.data.scatter!;
	}

	public collide(coll: CollisionEvent, player: Player): void {
		if (!this.isEnabled) {
			return;
		}

		// needs to be computed before Collide3DWall()
		const dot = coll.hitNormal!.dot(coll.ball.hit.vel);

		// reflect ball from wall
		coll.ball.hit.collide3DWall(coll.hitNormal!, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		// if velocity greater than threshold level
		if (this.data.hitEvent && (dot <= -this.data.threshold)) {
			// add a chunk of velocity to drive ball away
			coll.ball.hit.vel.add(coll.hitNormal!.clone().multiplyScalar(this.data.force));

			this.animation.hitEvent = true;
			this.animation.ballHitPosition = coll.ball.state.pos.clone();
			this.events.fireGroupEvent(FireEvent.HitEventsHit);
		}
	}
}
