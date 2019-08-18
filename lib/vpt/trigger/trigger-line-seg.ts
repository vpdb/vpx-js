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

import { Vertex2D } from '../../math/vertex2d';
import { CollisionEvent } from '../../physics/collision-event';
import { CollisionType } from '../../physics/collision-type';
import { STATICTIME } from '../../physics/constants';
import { FireEvent } from '../../physics/fire-events';
import { HitTestResult } from '../../physics/hit-object';
import { LineSeg } from '../../physics/line-seg';
import { Ball } from '../ball/ball';
import { TriggerData } from './trigger-data';
import { TriggerEvents } from './trigger-events';

export class TriggerLineSeg extends LineSeg<TriggerEvents> {

	private readonly data: TriggerData;

	constructor(p1: Vertex2D, p2: Vertex2D, zLow: number, zHigh: number, data: TriggerData) {
		super(p1, p2, zLow, zHigh, undefined);
		this.data = data;
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent): HitTestResult {
		if (!this.data.isEnabled) {
			return { hitTime: -1.0, coll };
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
		if (!coll.hitFlag !== i < 0) {                                            // Hit == NotAlreadyHit
			ball.state.pos.add(ball.hit.vel.clone().multiplyScalar(STATICTIME));  // move ball slightly forward

			if (i < 0) {
				ball.hit.vpVolObjs.push(this.obj!);
				this.obj!.triggerAnimationHit();
				this.obj!.fireGroupEvent(FireEvent.HitEventsHit);

			} else {
				ball.hit.vpVolObjs.splice(i, 1);
				this.obj!.triggerAnimationUnhit();
				this.obj!.fireGroupEvent(FireEvent.HitEventsUnhit);
			}
		}
	}
}
