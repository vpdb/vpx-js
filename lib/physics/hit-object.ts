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
import { EventProxy } from '../game/event-proxy';
import { PlayerPhysics } from '../game/player-physics';
import { degToRad } from '../math/float';
import { FRect3D } from '../math/frect3d';
import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { IPhysicalData } from '../vpt/item-data';
import { Table } from '../vpt/table/table';
import { CollisionEvent } from './collision-event';
import { CollisionType } from './collision-type';

export abstract class HitObject {

	/**
	 * Base object pointer.
	 *
	 * Mainly used as IFireEvents, but also as HitTarget or Primitive or Trigger or Kicker or Gate.
	 */
	public obj?: EventProxy;

	public threshold: number = 0;  // threshold for firing an event (usually (always??) normal dot ball-velocity)
	public hitBBox: FRect3D = new FRect3D();

	public elasticity: number = 0.3;
	public elasticityFalloff: number = 0;
	public friction: number = 0.3;
	public scatter: number = 0; // in radians

	protected objType: CollisionType = CollisionType.Null;
	public isEnabled: boolean = true;

	/**
	 * FireEvents for m_obj?
	 */
	public fe: boolean = false;

	/**
	 * currently only used to determine which HitTriangles/HitLines/HitPoints
	 * are being part of the same Primitive element m_obj, to be able to early
	 * out intersection traversal if primitive is flagged as not collidable
	 */
	public e: boolean = false;

	public abstract calcHitBBox(): void;

	public abstract hitTest(ball: Ball, dTime: number, coll: CollisionEvent, physics: PlayerPhysics): number;

	public abstract collide(coll: CollisionEvent, physics: PlayerPhysics): void;

	/**
	 * apply contact forces for the given time interval. Ball, Spinner and Gate do nothing here, Flipper has a specialized handling
	 * @param coll
	 * @param dTime
	 * @param physics
	 * @constructor
	 */
	public contact(coll: CollisionEvent, dTime: number, physics: PlayerPhysics): void {
		coll.ball.hit.handleStaticContact(coll, this.friction, dTime, physics);
	}

	public setFriction(friction: number): this {
		this.friction = friction;
		return this;
	}

	public setScatter(scatter: number): this {
		this.scatter = scatter;
		return this;
	}

	public fireHitEvent(ball: Ball): void {
		if (this.obj && this.fe && this.isEnabled) {

			// is this the same place as last event? if same then ignore it
			const posDiff = ball.hit.eventPos.clone(true).sub(ball.state.pos);
			const distLs = posDiff.lengthSq();
			Vertex3D.release(posDiff);

			// remember last collide position
			ball.hit.eventPos.set(ball.state.pos.x, ball.state.pos.y, ball.state.pos.z);

			// hit targets when used with a captured ball have always a too small distance
			const normalDist = (this.objType === CollisionType.HitTarget) ? 0.0 : 0.25; // magic distance

			if (distLs > normalDist) { // must be a new place if only by a little
				this.obj!.fireGroupEvent(Event.HitEventsHit);
			}
		}
	}

	public setElasticity(elasticity: number, elasticityFalloff?: number): this {
		this.elasticity = elasticity;
		if (elasticityFalloff !== undefined) {
			this.elasticityFalloff = elasticityFalloff;
		}
		return this;
	}

	public setZ(zLow: number, zHigh: number): this {
		this.hitBBox.zlow = zLow;
		this.hitBBox.zhigh = zHigh;
		return this;
	}

	public setEnabled(isEnabled: boolean) {
		this.isEnabled = isEnabled;
	}

	public setType(type: CollisionType) {
		this.objType = type;
	}

	public doHitTest(ball: Ball, coll: CollisionEvent, physics: PlayerPhysics): void {
		if (!ball) {
			return;
		}

		if (this.obj && this.obj.abortHitTest && this.obj.abortHitTest()) {
			return;
		}

		const newColl = CollisionEvent.claim(ball);
		const newTime = this.hitTest(ball, coll.hitTime, !physics.recordContacts ? coll : newColl, physics);
		const validHit = newTime >= 0 && newTime <= coll.hitTime;

		if (!physics.recordContacts) {            // simply find first event
			if (validHit) {
				coll.ball = ball;
				coll.obj = this;
				coll.hitTime = newTime;
			}
			CollisionEvent.release(newColl);

		} else {                                 // find first collision, but also remember all contacts
			if (newColl.isContact || validHit) {
				newColl.ball = ball;
				newColl.obj = this;

				if (newColl.isContact) {
					physics.contacts.push(newColl);

				} else {                         // if (validhit)
					coll.set(newColl);
					coll.hitTime = newTime;
					CollisionEvent.release(newColl);
				}
			} else {
				CollisionEvent.release(newColl);
			}
		}
	}

	public applyPhysics(data: IPhysicalData, table: Table) {
		const mat = table.getMaterial(data.szPhysicsMaterial);
		if (mat && !data.overwritePhysics) {
			this.setElasticity(mat.fElasticity, mat.fElasticityFalloff);
			this.setFriction(mat.fFriction);
			this.setScatter(degToRad(mat.fScatterAngle));

		} else {
			this.setElasticity(data.elasticity, data.elasticityFalloff);
			this.setFriction(data.friction);
			this.setScatter(degToRad(data.scatter));
		}

		this.setEnabled(data.isCollidable);
	}
}
