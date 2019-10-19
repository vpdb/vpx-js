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

import { Event } from '../../game/event';
import { EventProxy } from '../../game/event-proxy';
import { PlayerPhysics } from '../../game/player-physics';
import { CollisionEvent } from '../../physics/collision-event';
import { HitCircle } from '../../physics/hit-circle';
import { BumperAnimation } from './bumper-animation';
import { BumperData } from './bumper-data';
import { BumperState } from './bumper-state';

export class BumperHit extends HitCircle {

	private readonly data: BumperData;
	private readonly state: BumperState;
	private readonly animation: BumperAnimation;
	private readonly events: EventProxy;

	constructor(data: BumperData, state: BumperState, animation: BumperAnimation, events: EventProxy, height: number) {
		super(data.center, data.radius, height, height + data.heightScale);
		this.data = data;
		this.state = state;
		this.animation = animation;

		this.events = events;
		this.isEnabled = this.data.isCollidable;
		this.scatter = this.data.scatter!;
	}

	public collide(coll: CollisionEvent, physics: PlayerPhysics): void {
		if (!this.isEnabled) {
			return;
		}

		// needs to be computed before Collide3DWall()
		const dot = coll.hitNormal.dot(coll.ball.hit.vel);

		// reflect ball from wall
		coll.ball.hit.collide3DWall(coll.hitNormal, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		// if velocity greater than threshold level
		if (this.data.hitEvent && (dot <= -this.data.threshold)) {
			// add a chunk of velocity to drive ball away
			coll.ball.hit.vel.addAndRelease(coll.hitNormal.clone(true).multiplyScalar(this.data.force));

			this.animation.hitEvent = true;
			this.animation.ballHitPosition.setAndRelease(coll.ball.state.pos.clone(true));
			this.events.fireGroupEvent(Event.HitEventsHit);
		}
	}
}
