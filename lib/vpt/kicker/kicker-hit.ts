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

import { kickerHitVertices } from '../../../res/meshes/kicker-hit-mesh';
import { Event } from '../../game/event';
import { EventProxy } from '../../game/event-proxy';
import { PlayerPhysics } from '../../game/player-physics';
import { degToRad } from '../../math/float';
import { clamp } from '../../math/functions';
import { Vertex3D } from '../../math/vertex3d';
import { CollisionEvent } from '../../physics/collision-event';
import { CollisionType } from '../../physics/collision-type';
import { STATICTIME } from '../../physics/constants';
import { HARD_SCATTER } from '../../physics/functions';
import { HitCircle } from '../../physics/hit-circle';
import { Ball } from '../ball/ball';
import { FLT_MAX } from '../mesh';
import { Table } from '../table/table';
import { KickerData } from './kicker-data';

/* tslint:disable:no-bitwise */
export class KickerHit extends HitCircle {

	private data: KickerData;
	public ball?: Ball;  // The ball inside this kicker
	public lastCapturedBall?: Ball;
	private hitMesh: Vertex3D[] = [];
	public obj: EventProxy;

	constructor(data: KickerData, events: EventProxy, table: Table, radius: number, height: number) {
		super(data.vCenter.clone(), radius, height, height + data.hitHeight);
		this.data = data;

		if (!this.data.legacyMode) {
			const rad = this.radius * 0.8;
			for (let t = 0; t < kickerHitVertices.length; t++) {
				// find the right normal by calculating the distance from current ball position to vertex of the kicker mesh
				const vPos = new Vertex3D(kickerHitVertices[t].x, kickerHitVertices[t].y, kickerHitVertices[t].z);
				vPos.x = vPos.x * rad + this.data.vCenter.x;
				vPos.y = vPos.y * rad + this.data.vCenter.y;
				vPos.z = vPos.z * rad * table.getScaleZ() + height;
				this.hitMesh[t] = vPos;
			}
		}

		this.isEnabled = this.data.isEnabled;
		this.objType = CollisionType.Kicker;
		this.obj = events;
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent): number {
		// any face, not-lateral, non-rigid
		return this.hitTestBasicRadius(ball, dTime, coll, false, false, false);
	}

	public collide(coll: CollisionEvent, physics: PlayerPhysics): void {
		this.doCollide(physics, coll.ball, coll.hitNormal, coll.hitFlag, false);
	}

	public doCollide(physics: PlayerPhysics, ball: Ball, hitNormal: Vertex3D, hitBit: boolean, newBall: boolean) {

		if (this.ball) {
			// a previous ball already in kicker
			return;
		}

		const i = ball.hit.vpVolObjs.indexOf(this.obj);    // check if kicker in ball's volume set

		if (newBall || hitBit !== (i < 0)) {               // New or (Hit && !Vol || UnHit && Vol)

			if (this.data.legacyMode || newBall) {
				// move ball slightly forward
				ball.state.pos.addAndRelease(ball.hit.vel.clone(true).multiplyScalar(STATICTIME));
			}

			if (i < 0) { // entering Kickers volume
				let hitEvent: boolean;
				const grabHeight = (this.hitBBox.zlow + ball.data.radius) * this.data.hitAccuracy;

				if (ball.state.pos.z < grabHeight || this.data.legacyMode || newBall) {
					// early out here if the ball is slow and we are near the kicker center
					hitEvent = true;

				} else {
					hitEvent = false;
					this.doChangeBallVelocity(ball, hitNormal);

					// this is an ugly hack to prevent the ball stopping rapidly at the kicker bevel
					// something with the friction calculation is wrong in the physics engine
					// so we monitor the ball velocity if it drop under a length value of 0.2
					// if so we take the last "good" velocity to help the ball moving over the critical spot at the kicker bevel
					// this hack seems to work only if the kicker is on the playfield, a kicker attached to a wall has still problems
					// because the friction calculation for a wall is also different
					const length = ball.hit.vel.length();
					if (length < 0.2) {
						ball.hit.vel.set(ball.oldVel);
					}
					ball.oldVel.set(ball.hit.vel);
				}

				if (hitEvent) {
					if (this.data.fallThrough) {
						ball.state.isFrozen = false;

					} else {
						ball.state.isFrozen = true;
						ball.hit.vpVolObjs.push(this.obj!); // add kicker to ball's volume set
						this.ball = ball;
						this.lastCapturedBall = ball;
						if (ball === physics.activeBallBC) {
							physics.activeBallBC = undefined;
						}
					}

					// Don't fire the hit event if the ball was just created
					// Fire the event before changing ball attributes, so scripters can get a useful ball state
					if (!newBall) {
						this.obj.fireGroupEvent(Event.HitEventsHit);
					}

					if (ball.state.isFrozen || this.data.fallThrough) {  // script may have unfrozen the ball

						// if ball falls through hole, we fake the collision algo by changing the ball height
						// in HitTestBasicRadius() the z-position of the ball is checked if it is >= to the hit cylinder
						// if we don't change the height of the ball we get a lot of hit events while the ball is falling!!

						// Only mess with variables if ball was not kicked during event
						ball.hit.vel.setZero();
						ball.hit.angularMomentum.setZero();
						ball.hit.angularVelocity.setZero();
						ball.state.pos.x = this.center.x;
						ball.state.pos.y = this.center.y;
						if (this.data.fallThrough) {
							ball.state.pos.z = this.hitBBox.zlow - ball.data.radius - 5.0;

						} else {
							ball.state.pos.z = this.hitBBox.zlow + ball.data.radius;
						}
					} else {
						// make sure
						this.ball = undefined;
					}
				}

			} else { // exiting kickers volume
				ball.hit.vpVolObjs.splice(i, 1); // remove kicker to ball's volume set
				this.obj.fireGroupEvent(Event.HitEventsUnhit);
			}
		}
	}

	private doChangeBallVelocity(ball: Ball, hitNormal: Vertex3D): void {

		let minDistSqr = FLT_MAX;
		let idx = 3435973836;
		for (let t = 0; t < this.hitMesh.length; t++) {

			// find the right normal by calculating the distance from current ball position to vertex of the kicker mesh
			const dist = ball.state.pos.clone(true).sub(this.hitMesh[t]);
			const lengthSqr = dist.lengthSq();
			Vertex3D.release(dist);
			if (lengthSqr < minDistSqr) {
				minDistSqr = lengthSqr;
				idx = t;
			}
		}
		//minDist_sqr = sqrtf(minDist_sqr);

		if (idx !== 3435973836) {
			// we have the nearest vertex now use the normal and damp it so it doesn't speed up the ball velocity too much
			const hitNorm = Vertex3D.claim(kickerHitVertices[idx].nx, kickerHitVertices[idx].ny, kickerHitVertices[idx].nz);
			const dot = -ball.hit.vel.dot(hitNorm);
			const reactionImpulse = ball.data.mass * Math.abs(dot);

			const surfP = hitNormal.clone(true).multiplyScalar(-ball.data.radius);  // surface contact point relative to center of mass
			const surfVel = ball.hit.surfaceVelocity(surfP, true);                  // velocity at impact point
			const tangent = surfVel.clone(true).subAndRelease(                      // calc the tangential velocity
				hitNorm.clone(true).multiplyScalar(surfVel.dot(hitNormal)),
			);

			ball.hit.vel.addAndRelease(hitNorm.clone(true).multiplyScalar(dot)); // apply collision impulse (along normal, so no torque)
			Vertex3D.release(hitNorm);

			const friction = 0.3;
			const tangentSpSq = tangent.lengthSq();

			if (tangentSpSq > 1e-6) {
				tangent.divideScalar(Math.sqrt(tangentSpSq));                  // normalize to get tangent direction
				const vt = surfVel.dot(tangent);                               // get speed in tangential direction

				// compute friction impulse
				const cross = Vertex3D.crossProduct(surfP, tangent, true);
				const pv1 = cross.clone(true).divideScalar(ball.hit.inertia);
				const kt = ball.hit.invMass + tangent.dotAndRelease(Vertex3D.crossProduct(pv1, surfP, true));

				// friction impulse can't be greater than coefficient of friction times collision impulse (Coulomb friction cone)
				const maxFriction = friction * reactionImpulse;
				const jt = clamp(-vt / kt, -maxFriction, maxFriction);

				ball.hit.applySurfaceImpulseAndRelease(
					cross.clone(true).multiplyScalar(jt),
					tangent.clone(true).multiplyScalar(jt),
				);
				Vertex3D.release(cross, pv1);
			}
			Vertex3D.release(surfP, surfVel, tangent);
		}
	}

	public kickXyz(table: Table, physics: PlayerPhysics, angle: number, speed: number, inclination: number, pos: Vertex3D = new Vertex3D()): void {

		if (!this.ball) {
			return;
		}

		if (!physics.activeBallBC) {
			// Ball control most recently kicked if none currently.
			physics.activeBallBC = this.ball;
		}

		if (physics.activeBallBC === this.ball) {
			// Clear any existing ball control target to allow kickout to work correctly.
			physics.bcTarget = undefined;
		}
		let angleRad = degToRad(angle);                                        // yaw angle, zero is along -Y axis

		if (Math.abs(inclination) > Math.PI / 2.0) {                           // radians or degrees?  if greater PI/2 assume degrees
			inclination *= Math.PI / 180.0;                                    // convert to radians
		}

		let scatterAngle = this.data.scatter < 0.0                             // if < 0 use global value
			? HARD_SCATTER
			: degToRad(this.data.scatter);
		scatterAngle *= table.getGlobalDifficulty();                           // apply difficulty weighting

		if (scatterAngle > 1.0e-5) {                                           // ignore near zero angles
			let scatter = Math.random() * 2 - 1;                               // -1.0f..1.0f
			scatter *= (1.0 - scatter * scatter) * 2.59808 * scatterAngle;     // shape quadratic distribution and scale
			angleRad += scatter;
		}

		const speedZ = Math.sin(inclination) * speed;
		if (speedZ > 0.0) {
			speed *= Math.cos(inclination);
		}

		this.ball.hit.angularVelocity.setZero();
		this.ball.hit.angularMomentum.setZero();
		this.ball.hit.coll.hitDistance = 0.0;
		this.ball.hit.coll.hitTime = -1.0;
		this.ball.hit.coll.hitNormal.setZero();
		this.ball.hit.coll.hitVel.setZero();
		this.ball.hit.coll.hitFlag = false;
		this.ball.hit.coll.isContact = false;
		this.ball.hit.coll.hitMomentBit = true;
		this.ball.state.pos.x += pos.x; // brian's suggestion
		this.ball.state.pos.y += pos.y;
		this.ball.state.pos.z += pos.z;
		this.ball.hit.vel.x = Math.sin(angleRad) * speed;
		this.ball.hit.vel.y = -Math.cos(angleRad) * speed;
		this.ball.hit.vel.z = speedZ;
		this.ball.state.isFrozen = false;
		this.ball = undefined;
	}

}
