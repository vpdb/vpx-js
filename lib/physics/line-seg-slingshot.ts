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

import { Vertex2D } from '../math/vertex2d';
import { SurfaceData } from '../vpt/surface/surface-data';
import { CollisionEvent } from './collision-event';
import { LineSeg } from './line-seg';

export class LineSegSlingshot extends LineSeg {

	private readonly surfaceData: SurfaceData;
	//private slingshotAnim: SlingshotAnimObject;
	public force: number = 0;
	private eventTimeReset: number = 0;
	private doHitEvent: boolean = false;

	constructor(surfaceData: SurfaceData, p1: Vertex2D, p2: Vertex2D, zLow: number, zHigh: number) {
		super(p1, p2, zLow, zHigh);
		this.surfaceData = surfaceData;
	}

	public collide(coll: CollisionEvent): void {
		const pball = coll.ball;
		const hitnormal = coll.hitNormal!;

		const dot = coll.hitNormal!.dot(coll.ball.hit.vel); // normal velocity to slingshot

		const threshold = (dot <= -this.surfaceData.slingshotThreshold);  // normal greater than threshold?

		if (/*!this.m_psurface->m_fDisabled && */threshold) { // enabled and if velocity greater than threshold level
			const len = (this.v2.x - this.v1.x) * hitnormal.y - (this.v2.y - this.v1.y) * hitnormal.x; // length of segment, Unit TAN points from V1 to V2

			const vhitpoint = new Vertex2D(
				pball.state.pos.x - hitnormal.x * pball.data.radius, //project ball radius along norm
				pball.state.pos.y - hitnormal.y * pball.data.radius,
			);

			// vhitpoint will now be the point where the ball hits the line
			// Calculate this distance from the center of the slingshot to get force

			const btd = (vhitpoint.x - this.v1.x) * hitnormal.y - (vhitpoint.y - this.v1.y) * hitnormal.x; // distance to vhit from V1
			let force = (Math.abs(len) > 1.0e-6) ? ((btd + btd) / len - 1.0) : -1.0;	// -1..+1
			force = 0.5 * (1.0 - force * force);	//!! maximum value 0.5 ...I think this should have been 1.0...oh well
			// will match the previous physics
			force *= this.force; //-80;

			pball.hit.vel.sub(hitnormal.clone().multiplyScalar(force));	// boost velocity, drive into slingshot (counter normal), allow CollideWall to handle the remainder
		}

		pball.hit.collide3DWall(hitnormal, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		// FIXME event slingshot
		// if (this.obj && this.fe && /*!m_psurface->m_fDisabled && */threshold) {
		// 	// is this the same place as last event? if same then ignore it
		// 	const dist_ls = (pball->m_Event_Pos - pball->m_pos).LengthSquared();
		// 	pball->m_Event_Pos = pball->m_pos; //remember last collide position
		//
		// 	if (dist_ls > 0.25f) // must be a new place if only by a little
		// 	{
		// 		((IFireEvents *)m_obj)->FireGroupEvent(DISPID_SurfaceEvents_Slingshot);
		// 		m_slingshotanim.m_TimeReset = g_pplayer->m_time_msec + 100;
		// 	}
		// }
	}

}
