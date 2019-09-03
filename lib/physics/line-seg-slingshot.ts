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

import { Event } from '../game/event';
import { PlayerPhysics } from '../game/player-physics';
import { Vertex2D } from '../math/vertex2d';
import { Surface } from '../vpt/surface/surface';
import { SurfaceData } from '../vpt/surface/surface-data';
import { SlingshotAnimObject } from './anim-slingshot';
import { CollisionEvent } from './collision-event';
import { LineSeg } from './line-seg';
import { Vertex3D } from '../math/vertex3d';

export class LineSegSlingshot extends LineSeg {

	private readonly physics: PlayerPhysics;
	private readonly surface: Surface;
	private readonly surfaceData: SurfaceData;
	private slingshotAnim = new SlingshotAnimObject();
	public force: number = 0;
	private eventTimeReset: number = 0;
	public doHitEvent: boolean = false;

	constructor(surface: Surface, surfaceData: SurfaceData, p1: Vertex2D, p2: Vertex2D, zLow: number, zHigh: number, physics: PlayerPhysics) {
		super(p1, p2, zLow, zHigh);
		this.surface = surface;
		this.surfaceData = surfaceData;
		this.physics = physics;
	}

	public collide(coll: CollisionEvent): void {
		const ball = coll.ball;
		const hitNormal = coll.hitNormal;

		const dot = coll.hitNormal.dot(coll.ball.hit.vel);                    // normal velocity to slingshot
		const threshold = (dot <= -this.surfaceData.slingshotThreshold);       // normal greater than threshold?

		if (!this.surface.isDisabled && threshold) {                           // enabled and if velocity greater than threshold level
			const len = (this.v2.x - this.v1.x) * hitNormal.y - (this.v2.y - this.v1.y) * hitNormal.x; // length of segment, Unit TAN points from V1 to V2

			const vHitPoint = Vertex2D.claim(
				ball.state.pos.x - hitNormal.x * ball.data.radius,          // project ball radius along norm
				ball.state.pos.y - hitNormal.y * ball.data.radius,
			);

			// vHitPoint will now be the point where the ball hits the line
			// Calculate this distance from the center of the slingshot to get force
			const btd = (vHitPoint.x - this.v1.x) * hitNormal.y - (vHitPoint.y - this.v1.y) * hitNormal.x; // distance to vhit from V1
			Vertex2D.release(vHitPoint);
			let force = (Math.abs(len) > 1.0e-6) ? ((btd + btd) / len - 1.0) : -1.0;                       // -1..+1
			force = 0.5 * (1.0 - force * force);                               // !! maximum value 0.5 ...I think this should have been 1.0...oh well
			// will match the previous physics
			force *= this.force; //-80;

			// boost velocity, drive into slingshot (counter normal), allow CollideWall to handle the remainder
			const normForce = hitNormal.clone(true).multiplyScalar(force);
			ball.hit.vel.sub(normForce);
			Vertex3D.release(normForce);
		}

		ball.hit.collide3DWall(hitNormal, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		if (this.obj && this.fe && !this.surface.isDisabled && this.threshold) {
			// is this the same place as last event? if same then ignore it
			const eventPos = ball.hit.eventPos.clone(true);
			const distLs = eventPos.sub(ball.state.pos).lengthSq();
			Vertex3D.release(eventPos);
			ball.hit.eventPos.set(ball.state.pos); //remember last collide position

			if (distLs > 0.25) { // must be a new place if only by a little
				this.obj.fireGroupEvent(Event.SurfaceEventsSlingshot);
				this.slingshotAnim.timeReset = this.physics.timeMsec + 100;
			}
		}
	}
}
