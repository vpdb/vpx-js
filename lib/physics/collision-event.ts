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
import { Vertex3D } from '../math/vertex3d';
import { Pool } from '../util/object-pool';
import { Ball } from '../vpt/ball/ball';
import { HitObject } from './hit-object';

export class CollisionEvent {

	private static readonly POOL = new Pool(CollisionEvent);

	/**
	 * The ball that collided with something
	 */
	public ball: Ball;

	/**
	 * What the ball collided with
	 */
	public obj?: HitObject;

	/**
	 * Set to true if impact velocity is ~0
	 */
	public isContact: boolean = false;

	/**
	 * When the collision happens (relative to current physics state)
	 */
	public hitTime: number = 0;

	/**
	 * Hit distance
	 */
	public hitDistance: number = 0;

	/**
	 * Additional collision information
	 */
	public readonly hitNormal: Vertex3D = new Vertex3D();

	/**
	 * Only "correctly" used by plunger and flipper
	 */
	public hitVel: Vertex2D = new Vertex2D();

	/**
	 * Only set if isContact is true
	 */
	public hitOrgNormalVelocity: number = 0;

	/**
	 * Currently only one bit is used (hitmoment == 0 or not)
	 */
	public hitMomentBit: boolean = true;

	/**
	 * UnHit signal/direction of hit/side of hit (spinner/gate)
	 */
	public hitFlag: boolean = false;

	constructor(ball?: Ball) {
		this.ball = ball!;
	}

	public static claim(ball: Ball): CollisionEvent {
		const event = CollisionEvent.POOL.get();
		event.ball = ball;
		return event;
	}

	public static release(...events: CollisionEvent[]) {
		for (const event of events) {
			CollisionEvent.POOL.release(event);
		}
	}

	public static reset(event: CollisionEvent): void {
		delete event.ball;
		delete event.obj;
		event.isContact = false;
		event.hitTime = 0;
		event.hitDistance = 0;
		event.hitNormal.setZero();
		event.hitVel.setZero();
		event.hitOrgNormalVelocity = 0;
		event.hitMomentBit = true;
		event.hitFlag = false;
	}

	public clear() {
		this.obj = undefined;
	}

	public set(coll: CollisionEvent): this {
		this.ball = coll.ball;
		this.obj = coll.obj;
		this.isContact = coll.isContact;
		this.hitTime = coll.hitTime;
		this.hitDistance = coll.hitDistance;
		this.hitNormal.set(coll.hitNormal);
		this.hitVel.set(coll.hitVel.x, coll.hitVel.y);
		this.hitOrgNormalVelocity = coll.hitOrgNormalVelocity;
		this.hitMomentBit = coll.hitMomentBit;
		this.hitFlag = coll.hitFlag;
		return this;
	}
}
