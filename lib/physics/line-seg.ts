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
import { CollisionEvent } from './collision-event';
import { CollisionType } from './collision-type';
import { HitObject } from './hit-object';

export class LineSeg extends HitObject {

	private readonly v1: Vertex2D;
	private readonly v2: Vertex2D;
	private normal!: Vertex2D;
	private length!: number;

	constructor(p1: Vertex2D, p2: Vertex2D, zLow: number, zHigh: number) {
		super();
		this.v1 = p1;
		this.v2 = p2;
		this.hitBBox.zlow = zLow;
		this.hitBBox.zhigh = zHigh;
		this.calcNormal();
	}

	public setSeg(x1: number, y1: number, x2: number, y2: number): this {
		this.v1.x = x1;
		this.v1.y = y1;
		this.v2.x = x2;
		this.v2.y = y2;
		return this.calcNormal();
	}

	public calcHitBBox(): void {
		// Allow roundoff
		this.hitBBox.left = Math.min(this.v1.x, this.v2.x);
		this.hitBBox.right = Math.max(this.v1.x, this.v2.x);
		this.hitBBox.top = Math.min(this.v1.y, this.v2.y);
		this.hitBBox.bottom = Math.max(this.v1.y, this.v2.y);

		// zlow and zhigh were already set in ctor
	}

	public collide(coll: CollisionEvent): void {
		const dot = coll.hitNormal!.dot(coll.ball.state.vel);
		coll.ball.getHitObject().collide3DWall(coll.hitNormal!, this.elasticity, this.elasticityFalloff, this.friction, this.scatter);

		if (dot <= -this.threshold) {
			this.fireHitEvent(coll.ball);
		}
	}

	private calcNormal(): this {
		const vT = new Vertex2D(this.v1.x - this.v2.x, this.v1.y - this.v2.y);

		// Set up line normal
		this.length = vT.length();
		const invLength = 1.0 / this.length;
		this.normal = new Vertex2D(vT.y * invLength, -vT.x * invLength);
		return this;
	}

	public getType(): CollisionType {
		return CollisionType.LineSeg;
	}
}
