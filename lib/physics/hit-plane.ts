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

import { Vertex3D } from '../math/vertex3d';
import { CollisionEvent } from './collision-event';
import { CollisionType } from './collision-type';
import { HitObject } from './hit-object';

export class HitPlane extends HitObject {

	private readonly normal: Vertex3D;
	private readonly d: number;

	constructor(normal: Vertex3D, d: number) {
		super();
		this.normal = normal;
		this.d = d;
	}

	public calcHitBBox(): void {
		// plane's not a box (i assume)
	}

	public collide(coll: CollisionEvent): void {
		coll.ball.getHitObject().collide3DWall(coll.hitNormal!, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		// if ball has penetrated, push it out of the plane
		const bnd = this.normal.dot(coll.ball.state.pos) - coll.ball.data.radius - this.d; // distance from plane to ball surface
		if (bnd < 0) {
			coll.ball.state.pos.add(this.normal.clone().multiplyScalar(bnd));
		}
	}

	public getType(): CollisionType {
		return CollisionType.Plane;
	}
}
