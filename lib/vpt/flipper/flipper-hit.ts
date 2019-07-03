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
import { Ball } from '../../physics/ball';
import { CollisionEvent } from '../../physics/collision-event';
import { eObjType } from '../../physics/collision-type';
import { MoverObject } from '../../physics/mover-object';
import { FlipperData } from './flipper-data';
import { FlipperMover } from './flipper-mover';

export class HitFlipper {

	private m_flipperMover: FlipperMover;
	private m_last_hittime: number;

	constructor(center: Vertex2D, baser: number, endr: number, flipr: number, angleStart: number, angleEnd: number, zlow: number, zhigh: number, data: FlipperData) {

	}

	public HitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {
		if (!this.m_flipperMover.isEnabled) {
			return -1;
		}

		const lastface = this.m_flipperMover.lastHitFace;

		// for effective computing, adding a last face hit value to speed calculations
		// a ball can only hit one face never two
		// also if a ball hits a face then it can not hit either radius
		// so only check these if a face is not hit
		// endRadius is more likely than baseRadius ... so check it first

		let hittime = this.HitTestFlipperFace(pball, dtime, coll, lastface); // first face
		if (hittime >= 0) {
			return hittime;
		}

		hittime = this.HitTestFlipperFace(pball, dtime, coll, !lastface); //second face
		if (hittime >= 0) {
			this.m_flipperMover.lastHitFace = !lastface; // change this face to check first // HACK
			return hittime;
		}

		hittime = this.HitTestFlipperEnd(pball, dtime, coll); // end radius
		if (hittime >= 0) {
			return hittime;
		}

		hittime = this.m_flipperMover.hitcircleBase.HitTest(pball, dtime, coll);
		if (hittime >= 0) {

			coll.hitvel.x = 0;		//Tangent velocity of contact point (rotate Normal right)
			coll.hitvel.y = 0;		//units: rad*d/t (Radians*diameter/time

			//!! unused coll.m_hitmoment = 0;			//moment is zero ... only friction
			coll.hitmomentBit = true;
			//!! unused coll.m_hitangularrate = 0;		//radians/time at collison

			return hittime;
		} else {
			return -1.0;	// no hits
		}
	}

	public GetType(): eObjType {
		return 'eFlipper';
	}

	public Collide(coll: CollisionEvent): void {

	}

	public Contact(coll: CollisionEvent, dtime: number): void {

	}

	public CalcHitBBox(): void {

	}

	public GetMoverObject(): MoverObject {
		return this.m_flipperMover;
	}

	public UpdatePhysicsFromFlipper(): void {

	}

	public HitTestFlipperFace(pball: Ball, dtime: number, coll: CollisionEvent, face1: boolean): number {

	}

	public HitTestFlipperEnd(pball: Ball, dtime: number, coll: CollisionEvent): number {

	}

	public GetHitTime(): number {
		return this.m_flipperMover.getHitTime();
	}
}
