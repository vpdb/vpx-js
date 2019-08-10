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

/* tslint:disable:no-bitwise */
import { Table } from '../..';
import { kickerHitVertices } from '../../../res/meshes/kicker-hit-mesh';
import { Player } from '../../game/player';
import { clamp } from '../../math/functions';
import { Vertex2D } from '../../math/vertex2d';
import { Vertex3D } from '../../math/vertex3d';
import { CollisionEvent } from '../../physics/collision-event';
import { CollisionType } from '../../physics/collision-type';
import { STATICTIME } from '../../physics/constants';
import { IFireEvents } from '../../physics/events';
import { HitCircle } from '../../physics/hit-circle';
import { HitTestResult } from '../../physics/hit-object';
import { Ball } from '../ball/ball';
import { FLT_MAX } from '../mesh';
import { KickerData } from './kicker-data';
import { KickerEvents } from './kicker-events';

export class KickerHit extends HitCircle {

	private data: KickerData;
	private ball?: Ball;  // The ball inside this kicker
	private lastCapturedBall?: Ball;
	private hitMesh: Vertex3D[] = [];
	public obj: IFireEvents;

	constructor(data: KickerData, table: Table, center: Vertex2D, radius: number, zLow: number, zHigh: number) {
		super(center, radius, zLow, zHigh);
		this.data = data;

		if (!this.data.legacyMode) {
			const rad = this.radius * 0.8;
			for (let t = 0; t < kickerHitVertices.length; t++) {
				// find the right normal by calculating the distance from current ball position to vertex of the kicker mesh
				const vpos = new Vertex3D(kickerHitVertices[t].x, kickerHitVertices[t].y, kickerHitVertices[t].z);
				vpos.x = vpos.x * rad + this.data.vCenter.x;
				vpos.y = vpos.y * rad + this.data.vCenter.y;
				vpos.z = vpos.z * rad * table.getScaleZ() + table.getTableHeight();
				this.hitMesh[t] = vpos;
			}
		}

		this.isEnabled = this.data.fEnabled;
		this.objType = CollisionType.Kicker;
		this.obj = new KickerEvents();
	}

	public hitTest(pball: Ball, dtime: number, coll: CollisionEvent): HitTestResult {
		//any face, not-lateral, non-rigid
		return this.hitTestBasicRadius(pball, dtime, coll, false, false, false);
	}

	public doCollide(player: Player, pball: Ball, hitnormal: Vertex3D, hitbit: boolean, newBall: boolean) {

		if (this.ball) {
			// a previous ball already in kicker
			return;
		}

		const i = pball.hit.vpVolObjs.indexOf(this.obj); // check if kicker in ball's volume set

		if (newBall || (!hitbit === i < 0)) {            // New or (Hit && !Vol || UnHit && Vol)

			if (this.data.legacyMode || newBall) {
				// move ball slightly forward
				pball.state.pos.add(pball.hit.vel.clone().multiplyScalar(STATICTIME));
			}

			if (i < 0) { // entering Kickers volume
				let hitEvent: boolean;
				const grabHeight = (this.hitBBox.zlow + pball.data.radius) * this.data.hitAccuracy;

				if (pball.state.pos.z < grabHeight || this.data.legacyMode || newBall) {
					// early out here if the ball is slow and we are near the kicker center
					hitEvent = true;
				} else {
					hitEvent = false;
					this.doChangeBallVelocity(pball, hitnormal);

					// this is an ugly hack to prevent the ball stopping rapidly at the kicker bevel
					// something with the friction calculation is wrong in the physics engine
					// so we monitor the ball velocity if it drop under a length value of 0.2
					// if so we take the last "good" velocity to help the ball moving over the critical spot at the kicker bevel
					// this hack seems to work only if the kicker is on the playfield, a kicker attached to a wall has still problems
					// because the friction calculation for a wall is also different
					const length = pball.hit.vel.length();
					if (length < 0.2) {
						pball.hit.vel.set(pball.oldVel!.x, pball.oldVel!.y, pball.oldVel!.z);
					}
					pball.oldVel = pball.hit.vel.clone();
				}

				if (hitEvent) {
					if (this.data.fallThrough) {
						pball.hit.isFrozen = false;

					} else {
						pball.hit.isFrozen = true;
						pball.hit.vpVolObjs.push(this.obj!);		// add kicker to ball's volume set
						this.ball = pball;
						this.lastCapturedBall = pball;
						if (pball === player.pactiveballBC) {
							player.pactiveballBC = undefined;
						}
					}

					// Don't fire the hit event if the ball was just created
					// Fire the event before changing ball attributes, so scripters can get a useful ball state
					// fixme event
					// if (!newBall) {
					// 	m_pkicker->FireGroupEvent(DISPID_HitEvents_Hit);
					// }

					if (pball.hit.isFrozen || this.data.fallThrough) {	// script may have unfrozen the ball

						// if ball falls through hole, we fake the collision algo by changing the ball height
						// in HitTestBasicRadius() the z-position of the ball is checked if it is >= to the hit cylinder
						// if we don't change the height of the ball we get a lot of hit events while the ball is falling!!

						// Only mess with variables if ball was not kicked during event
						pball.hit.vel.setZero();
						pball.hit.angularMomentum.setZero();
						pball.hit.angularVelocity.setZero();
						pball.state.pos.x = this.center.x;
						pball.state.pos.y = this.center.y;
						if (this.data.fallThrough) {
							pball.state.pos.z = this.hitBBox.zlow - pball.data.radius - 5.0;

						} else {
							pball.state.pos.z = this.hitBBox.zlow + pball.data.radius;
						}
					} else {
						// make sure
						this.ball = undefined;
					}
				}

			} else { // exiting kickers volume
				pball.hit.vpVolObjs.splice(i, 1); // remove kicker to ball's volume set
				// FIXME event
				// m_pkicker->FireGroupEvent(DISPID_HitEvents_Unhit);
			}
		}
	}

	private doChangeBallVelocity(pball: Ball, hitnormal: Vertex3D): void {
		let minDistSqr = FLT_MAX;
		let idx = ~0;
		for (let t = 0; t < this.hitMesh.length; t++) {

			// find the right normal by calculating the distance from current ball position to vertex of the kicker mesh
			const lengthSqr = pball.state.pos.clone().sub(this.hitMesh[t]).lengthSq();
			if (lengthSqr < minDistSqr) {
				minDistSqr = lengthSqr;
				idx = t;
			}
		}
		//minDist_sqr = sqrtf(minDist_sqr);

		if (idx !== ~0) {
			// we have the nearest vertex now use the normal and damp it so it doesn't speed up the ball velocity too much
			const hitnorm = new Vertex3D(kickerHitVertices[idx].nx, kickerHitVertices[idx].ny, kickerHitVertices[idx].nz);
			let surfVel: Vertex3D;
			let tangent: Vertex3D;
			let surfP: Vertex3D;
			const dot = -pball.hit.vel.dot(hitnorm);
			const reactionImpulse = pball.data.mass * Math.abs(dot);

			surfP = hitnormal.clone().multiplyScalar(-pball.data.radius);    // surface contact point relative to center of mass
			surfVel = pball.hit.surfaceVelocity(surfP);         // velocity at impact point
			tangent = surfVel.clone().sub(hitnorm.clone().multiplyScalar(surfVel.dot(hitnormal))); // calc the tangential velocity

			pball.hit.vel.add(hitnorm.clone().multiplyScalar(dot)); // apply collision impulse (along normal, so no torque)

			const friction = 0.3;
			const tangentSpSq = tangent.lengthSq();

			if (tangentSpSq > 1e-6) {
				tangent.divideScalar(Math.sqrt(tangentSpSq));           // normalize to get tangent direction
				const vt = surfVel.dot(tangent);   // get speed in tangential direction

				// compute friction impulse
				const cross = Vertex3D.crossProduct(surfP, tangent);
				const kt = pball.hit.invMass + tangent.dot(Vertex3D.crossProduct(cross.clone().divideScalar(pball.hit.inertia), surfP));

				// friction impulse can't be greater than coefficient of friction times collision impulse (Coulomb friction cone)
				const maxFric = friction * reactionImpulse;
				const jt = clamp(-vt / kt, -maxFric, maxFric);

				pball.hit.applySurfaceImpulse(cross.clone().multiplyScalar(jt), tangent.clone().multiplyScalar(jt));
			}
		}
	}
}
