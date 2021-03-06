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
import { Vertex2D } from '../../math/vertex2d';
import { CollisionEvent } from '../../physics/collision-event';
import { CollisionType } from '../../physics/collision-type';
import { STATICTIME } from '../../physics/constants';
import { LineSeg } from '../../physics/line-seg';
import { Ball } from '../ball/ball';
import { TriggerAnimation } from './trigger-animation';
import { TriggerData } from './trigger-data';

export class TriggerLineSeg extends LineSeg {

	private readonly data: TriggerData;
	private readonly animation: TriggerAnimation;

	constructor(p1: Vertex2D, p2: Vertex2D, zLow: number, zHigh: number, data: TriggerData, animation: TriggerAnimation) {
		super(p1, p2, zLow, zHigh, undefined);
		this.data = data;
		this.animation = animation;
		this.objType = CollisionType.Trigger;
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent): number {
		if (!this.data.isEnabled) {
			return -1.0;
		}

		// approach either face, not lateral-rolling point (assume center), not a rigid body contact
		return this.hitTestBasic(ball, dTime, coll, false, false, false);
	}

	public collide(coll: CollisionEvent): void {
		const ball = coll.ball;

		if (this.objType !== CollisionType.Trigger || !ball.hit.isRealBall()) {
			return;
		}

		const i = ball.hit.vpVolObjs.indexOf(this.obj!);

		// if -1 then not in objects volume set (i.e not already hit)
		if (coll.hitFlag !== i < 0) {                                             // Hit == NotAlreadyHit
			ball.state.pos.addAndRelease(ball.hit.vel.clone(true).multiplyScalar(STATICTIME));  // move ball slightly forward

			if (i < 0) {
				ball.hit.vpVolObjs.push(this.obj!);
				this.animation.triggerAnimationHit();
				this.obj!.fireGroupEvent(Event.HitEventsHit);

			} else {
				ball.hit.vpVolObjs.splice(i, 1);
				this.animation.triggerAnimationUnhit();
				this.obj!.fireGroupEvent(Event.HitEventsUnhit);
			}
		}
	}
}
