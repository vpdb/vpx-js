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

import { Player } from '../game/player';
import { FRect3D } from '../math/frect3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { CollisionType } from './collision-type';
import { IFireEvents } from './events';
import { MoverObject } from './mover-object';

export abstract class HitObject {

	private pfeDebug?: IFireEvents;
	public obj?: IFireEvents; // base object pointer (mainly used as IFireEvents, but also as HitTarget or Primitive or Trigger or Kicker or Gate, see below)

	protected threshold: number = 0;  // threshold for firing an event (usually (always??) normal dot ball-velocity)

	public hitBBox: FRect3D = new FRect3D();

	protected elasticity: number = 0.3;
	protected elasticityFalloff: number = 0;
	protected friction: number = 0.3;
	protected scatter: number = 0; // in radians

	protected objType: CollisionType = CollisionType.Null;

	protected isEnabled: boolean = true;

	/**
	 * FireEvents for m_obj?
	 */
	protected fe: boolean = false;

	/**
	 * currently only used to determine which HitTriangles/HitLines/HitPoints
	 * are being part of the same Primitive element m_obj, to be able to early
	 * out intersection traversal if primitive is flagged as not collidable
	 */
	public e: boolean = false;

	public abstract getType(): CollisionType;
	public abstract calcHitBBox(): void;
	public abstract collide(coll: CollisionEvent, player: Player): void;
	public abstract hitTest(pball: Ball, dtime: number, coll: CollisionEvent): number;

	public getMoverObject(): MoverObject | undefined {
		return undefined;
	}

	/**
	 * apply contact forces for the given time interval. Ball, Spinner and Gate do nothing here, Flipper has a specialized handling
	 * @param coll
	 * @param dtime
	 * @param player
	 * @constructor
	 */
	public contact(coll: CollisionEvent, dtime: number, player: Player): void {
		coll.ball.getHitObject().handleStaticContact(coll, this.friction, dtime, player);
	}

	public setFriction(friction: number): this {
		this.friction = friction;
		return this;
	}

	public setScatter(scatter: number): this {
		this.scatter = scatter;
		return this;
	}

	public fireHitEvent(pball: Ball): void {
		if (this.obj && this.fe && this.isEnabled) {

			// fixme ifireevent
			// // is this the same place as last event? if same then ignore it
			// const distLs = (pball.eventPos.clone().sub(pball.pos!)).lengthSq();
			//
			// pball.eventPos = pball.pos!;    //remember last collide position
			//
			// // hit targets when used with a captured ball have always a too small distance
			// const normalDist = (this.objType === CollisionType.HitTarget) ? 0.0 : 0.25; //!! magic distance
			//
			// if (distLs > normalDist) { // must be a new place if only by a little
			// 	//this.obj.FireGroupEvent(DISPID_HitEvents_Hit);
			// }
		}
	}

	public setElasticy(elasticity: number, elasticityFalloff?: number): this {
		this.elasticity = elasticity;
		if (elasticityFalloff) {
			this.elasticityFalloff = elasticityFalloff;
		}
		return this;
	}

	public setZ(zLow: number, zHigh: number): this {
		this.hitBBox.zlow = zLow;
		this.hitBBox.zhigh = zHigh;
		return this;
	}

	public doHitTest(pball: Ball, coll: CollisionEvent, player: Player) {
		if (!pball) {
			return;
		}

		// fixme abstract this away
		//if (this.objType === CollisionType.HitTarget && (((this as HitTarget).obj).data.isDropped)) {
		//	return;
		//}

		const newColl = new CollisionEvent(pball);
		const newTime = this.hitTest(pball, coll.hitTime, !player.recordContacts ? coll : newColl);
		// fixme debug this, but in case sign is supposed to handle +/- infinity cases, javscript should cover that.
		const validHit = (newTime >= 0) /*&& !sign(newTime)*/ && (newTime <= coll.hitTime);

		if (!player.recordContacts) {// simply find first event
			if (validHit) {
			coll.ball = pball;
			coll.obj = this;
			coll.hitTime = newTime;
			}
		} else { // find first collision, but also remember all contacts
			if (newColl.isContact || validHit) {
				newColl.ball = pball;
				newColl.obj = this;

				if (newColl.isContact) {
					player.contacts.push(newColl);
				} else { //if (validhit)
					coll = newColl;
					coll.hitTime = newTime;
				}
			}
		}
	}
}
