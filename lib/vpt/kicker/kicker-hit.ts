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

import { Table } from '../..';
import { kickerHitVertices } from '../../../res/meshes/kicker-hit-mesh';
import { Player } from '../../game/player';
import { degToRad } from '../../math/float';
import { clamp } from '../../math/functions';
import { Vertex3D } from '../../math/vertex3d';
import { CollisionEvent } from '../../physics/collision-event';
import { CollisionType } from '../../physics/collision-type';
import { STATICTIME } from '../../physics/constants';
import { FireEvent, FireEvents } from '../../physics/fire-events';
import { hardScatter } from '../../physics/functions';
import { HitCircle } from '../../physics/hit-circle';
import { HitTestResult } from '../../physics/hit-object';
import { Ball } from '../ball/ball';
import { FLT_MAX } from '../mesh';
import { KickerData } from './kicker-data';

/* tslint:disable:no-bitwise */
export class KickerHit extends HitCircle {

	private data: KickerData;
	private ball?: Ball;  // The ball inside this kicker
	private lastCapturedBall?: Ball;
	private hitMesh: Vertex3D[] = [];
	public obj: FireEvents;

	constructor(data: KickerData, fireEvents: FireEvents, table: Table, radius: number, height: number) {
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
		this.obj = fireEvents;
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent): HitTestResult {
		// any face, not-lateral, non-rigid
		return this.hitTestBasicRadius(ball, dTime, coll, false, false, false);
	}

	public collide(coll: CollisionEvent, player: Player): void {
		this.doCollide(player, coll.ball, coll.hitNormal!, coll.hitFlag, false);
	}

	public doCollide(player: Player, ball: Ball, hitNormal: Vertex3D, hitBit: boolean, newBall: boolean) {

		if (this.ball) {
			// a previous ball already in kicker
			return;
		}

		const i = ball.hit.vpVolObjs.indexOf(this.obj);    // check if kicker in ball's volume set

		if (newBall || hitBit !== (i < 0)) {               // New or (Hit && !Vol || UnHit && Vol)

			if (this.data.legacyMode || newBall) {
				// move ball slightly forward
				ball.state.pos.add(ball.hit.vel.clone().multiplyScalar(STATICTIME));
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
					ball.oldVel = ball.hit.vel.clone();
				}

				if (hitEvent) {
					if (this.data.fallThrough) {
						ball.hit.isFrozen = false;

					} else {
						ball.hit.isFrozen = true;
						ball.hit.vpVolObjs.push(this.obj!); // add kicker to ball's volume set
						this.ball = ball;
						this.lastCapturedBall = ball;
						if (ball === player.pactiveballBC) {
							player.pactiveballBC = undefined;
						}
					}

					// Don't fire the hit event if the ball was just created
					// Fire the event before changing ball attributes, so scripters can get a useful ball state
					if (!newBall) {
						this.obj.fireGroupEvent(FireEvent.HitEventsHit);
					}

					if (ball.hit.isFrozen || this.data.fallThrough) {  // script may have unfrozen the ball

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
				this.obj.fireGroupEvent(FireEvent.HitEventsUnhit);
			}
		}
	}

	private doChangeBallVelocity(ball: Ball, hitNormal: Vertex3D): void {

		let minDistSqr = FLT_MAX;
		let idx = 3435973836;
		for (let t = 0; t < this.hitMesh.length; t++) {

			// find the right normal by calculating the distance from current ball position to vertex of the kicker mesh
			const lengthSqr = ball.state.pos.clone().sub(this.hitMesh[t]).lengthSq();
			if (lengthSqr < minDistSqr) {
				minDistSqr = lengthSqr;
				idx = t;
			}
		}
		//minDist_sqr = sqrtf(minDist_sqr);

		if (idx !== 3435973836) {
			// we have the nearest vertex now use the normal and damp it so it doesn't speed up the ball velocity too much
			const hitNorm = new Vertex3D(kickerHitVertices[idx].nx, kickerHitVertices[idx].ny, kickerHitVertices[idx].nz);
			const dot = -ball.hit.vel.dot(hitNorm);
			const reactionImpulse = ball.data.mass * Math.abs(dot);

			const surfP = hitNormal.clone().multiplyScalar(-ball.data.radius); // surface contact point relative to center of mass
			const surfVel = ball.hit.surfaceVelocity(surfP);                   // velocity at impact point
			const tangent = surfVel.clone().sub(                               // calc the tangential velocity
				hitNorm.clone().multiplyScalar(surfVel.dot(hitNormal)),
			);

			ball.hit.vel.add(hitNorm.clone().multiplyScalar(dot));             // apply collision impulse (along normal, so no torque)

			const friction = 0.3;
			const tangentSpSq = tangent.lengthSq();

			if (tangentSpSq > 1e-6) {
				tangent.divideScalar(Math.sqrt(tangentSpSq));                  // normalize to get tangent direction
				const vt = surfVel.dot(tangent);                               // get speed in tangential direction

				// compute friction impulse
				const cross = Vertex3D.crossProduct(surfP, tangent);
				const kt = ball.hit.invMass + tangent.dot(Vertex3D.crossProduct(cross.clone().divideScalar(ball.hit.inertia), surfP));

				// friction impulse can't be greater than coefficient of friction times collision impulse (Coulomb friction cone)
				const maxFriction = friction * reactionImpulse;
				const jt = clamp(-vt / kt, -maxFriction, maxFriction);

				ball.hit.applySurfaceImpulse(cross.clone().multiplyScalar(jt), tangent.clone().multiplyScalar(jt));
			}
		}
	}

	public kickXyz(table: Table, player: Player, angle: number, speed: number, inclination: number, pos: Vertex3D = new Vertex3D()): void {

		if (!this.ball) {
			return;
		}

		if (!player.pactiveballBC) {
			// Ball control most recently kicked if none currently.
			player.pactiveballBC = this.ball;
		}

		if (player.pactiveballBC === this.ball) {
			// Clear any existing ball control target to allow kickout to work correctly.
			player.pBCTarget = undefined;
		}
		let angleRad = degToRad(angle);                                        // yaw angle, zero is along -Y axis

		if (Math.abs(inclination) > Math.PI / 2.0) {                           // radians or degrees?  if greater PI/2 assume degrees
			inclination *= Math.PI / 180.0;                                    // convert to radians
		}

		let scatterAngle = this.data.scatter < 0.0                             // if < 0 use global value
			? hardScatter
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
		this.ball.hit.coll.hitNormal!.setZero();
		this.ball.hit.coll.hitVel!.setZero();
		this.ball.hit.coll.hitFlag = false;
		this.ball.hit.coll.isContact = false;
		this.ball.hit.coll.hitMomentBit = true;
		this.ball.state.pos.x += pos.x; // brian's suggestion
		this.ball.state.pos.y += pos.y;
		this.ball.state.pos.z += pos.z;
		this.ball.hit.vel.x = Math.sin(angleRad) * speed;
		this.ball.hit.vel.y = -Math.cos(angleRad) * speed;
		this.ball.hit.vel.z = speedZ;
		this.ball.hit.isFrozen = false;
		this.ball = undefined;
	}

}
