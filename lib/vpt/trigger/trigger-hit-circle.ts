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
import { CollisionType } from '../../physics/collision-type';
import { STATICTIME } from '../../physics/constants';
import { FireEvent, FireEvents } from '../../physics/fire-events';
import { HitCircle } from '../../physics/hit-circle';
import { HitTestResult } from '../../physics/hit-object';
import { Ball } from '../ball/ball';
import { Table } from '../table/table';
import { TriggerAnimation } from './trigger-animation';
import { TriggerData } from './trigger-data';

export class TriggerHitCircle extends HitCircle<FireEvents> {

	private readonly animation: TriggerAnimation;

	constructor(data: TriggerData, animation: TriggerAnimation, events: FireEvents, table: Table) {
		super(data.vCenter, data.radius, table.getSurfaceHeight(data.szSurface, data.vCenter.x, data.vCenter.y), table.getSurfaceHeight(data.szSurface, data.vCenter.x, data.vCenter.y) + data.hitHeight);
		this.animation = animation;
		this.isEnabled = data.isEnabled;
		this.objType = CollisionType.Trigger;
		this.obj = events;
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent): HitTestResult {
		// any face, not-lateral, non-rigid
		return super.hitTestBasicRadius(ball, dTime, coll, false, false, false);
	}

	public collide(coll: CollisionEvent, player: Player): void {
		const ball = coll.ball;

		if ((this.objType !== CollisionType.Trigger && this.objType !== CollisionType.Kicker) || !ball.hit.isRealBall()) {
			return;
		}

		const i = ball.hit.vpVolObjs.indexOf(this.obj!);                         // if -1 then not in objects volume set (i.e not already hit)
		if (coll.hitFlag !== i < 0) {                                            // Hit == NotAlreadyHit
			ball.state.pos.add(ball.hit.vel.clone().multiplyScalar(STATICTIME)); // move ball slightly forward

			if (i < 0) {
				ball.hit.vpVolObjs.push(this.obj!);
				this.animation.triggerAnimationHit();
				this.obj!.fireGroupEvent(FireEvent.HitEventsHit);

			} else {
				ball.hit.vpVolObjs.splice(i, 1);
				this.animation.triggerAnimationUnhit();
				this.obj!.fireGroupEvent(FireEvent.HitEventsUnhit);
			}
		}
	}
}
