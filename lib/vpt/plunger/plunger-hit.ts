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

import { EventProxy } from '../../game/event-proxy';
import { Player } from '../../game/player';
import { PlayerPhysics } from '../../game/player-physics';
import { CollisionEvent } from '../../physics/collision-event';
import { C_DISP_GAIN, C_DISP_LIMIT, C_EMBEDDED, C_EMBEDSHOT, C_LOWNORMVEL } from '../../physics/constants';
import { HitObject } from '../../physics/hit-object';
import { Ball } from '../ball/ball';
import { Table } from '../table/table';
import { Plunger, PlungerConfig } from './plunger';
import { PlungerData } from './plunger-data';
import { PlungerMover } from './plunger-mover';
import { PlungerState } from './plunger-state';

export class PlungerHit extends HitObject {

	private readonly mover: PlungerMover;
	private readonly data: PlungerData;

	constructor(data: PlungerData, state: PlungerState, events: EventProxy, cFrames: number, player: Player, table: Table) {
		super();
		const zHeight = table.getSurfaceHeight(data.szSurface, data.center.x, data.center.y);
		const config: PlungerConfig = {
			x: data.center.x - data.width,
			y: data.center.y + data.height,
			x2: data.center.x + data.width,
			zHeight,
			frameTop: data.center.y - data.stroke!,
			frameBottom: data.center.y,
			cFrames,
		};

		this.hitBBox.zlow = config.zHeight;
		this.hitBBox.zhigh = config.zHeight + Plunger.PLUNGER_HEIGHT;

		this.data = data;
		this.mover = new PlungerMover(config, data, state, events, player, table.getApi());
	}

	public getMoverObject(): PlungerMover {
		return this.mover;
	}

	public calcHitBBox(): void {
		// Allow roundoff
		this.hitBBox.left = this.mover.x - 0.1;
		this.hitBBox.right = this.mover.x2 + 0.1;
		this.hitBBox.top = this.mover.frameEnd - 0.1;
		this.hitBBox.bottom = this.mover.y + 0.1;

		// zlow & zhigh gets set in constructor
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent, physics: PlayerPhysics): number {

		let hitTime = dTime; //start time
		let isHit = false;

		// If we got here, then the ball is close enough to the plunger
		// to where we should animate the button's light.
		// Save the time so we can tell the button when to turn on/off.
		physics.lastPlungerHit = physics.timeMsec;

		// We are close enable the plunger light.
		const hit = CollisionEvent.claim(ball);

		// Check for hits on the non-moving parts, like the side of back
		// of the plunger.  These are just like hitting a wall.
		// Check all and find the nearest collision.
		let newTime = this.mover.lineSegBase.hitTest(ball, dTime, hit);
		if (newTime >= 0 && newTime <= hitTime) {
			isHit = true;
			hitTime = newTime;
			coll.set(hit);
			coll.hitVel.set(0, 0);
		}

		for (let i = 0; i < 2; i++) {
			newTime = this.mover.lineSegSide[i].hitTest(ball, hitTime, hit);
			if (newTime >= 0 && newTime <= hitTime) {
				isHit = true;
				hitTime = newTime;
				coll.set(hit);
				coll.hitVel.set(0, 0);
			}

			newTime = this.mover.jointBase[i].hitTest(ball, hitTime, hit);
			if (newTime >= 0 && newTime <= hitTime) {
				isHit = true;
				hitTime = newTime;
				coll.set(hit);
				coll.hitVel.set(0, 0);
			}
		}

		// Now check for hits on the business end, which might be moving.
		//
		// Our line segments are static, but they're meant to model a moving
		// object (the tip of the plunger).  We need to include the motion of
		// the tip to know if there's going to be a collision within the
		// interval we're covering, since it's not going to stay in the same
		// place throughout the interval.  Use a little physics trick: do the
		// calculation in an inertial frame where the tip is stationary.  To
		// do this, just adjust the ball speed to what it looks like in the
		// tip's rest frame.
		//
		// Note that we're about to cast the const Ball* to non-const and change
		// the object's contents.  This is bad practice, but we do it intentionally,
		// for speed.  Past versions made a local copy of the Ball instance, which
		// is technically the correct way to do this, but it takes longer and
		// messes with the ball IDs.  Before changing the speed value in the
		// (nominally) const Ball instance, save the old value so that we can
		// restore it when we're done.
		const oldVelY = ball.hit.vel.y;   // save the old velocity value
		ball.hit.vel.y -= this.mover.speed;     // WARNING! EVIL OVERRIDE OF CONST INSTANCE POINTER!!!

		// Figure the impulse from hitting the moving end.
		// Calculate this as the product of the plunger speed and the
		// momentum transfer factor, which essentially models the plunger's
		// mass in abstract units.  In practical terms, this lets table
		// authors fine-tune the plunger's strength in terms of the amount
		// of energy it transfers when striking a ball.  Note that table
		// authors can also adjust the strength via the release speed,
		// but that's also used for the visual animation, so it's not
		// always possible to get the right combination of visuals and
		// physics purely by adjusting the speed.  The momentum transfer
		// factor provides a way to tweak the physics without affecting
		// the visuals.
		//
		// Further adjust the transfered momentum by the ball's mass
		// (which is likewise in abstract units).  Divide by the ball's
		// mass, since a heavier ball will have less velocity transfered
		// for a given amount of momentum (p=mv -> v=p/m).
		//
		// Note that both the plunger momentum transfer factor and the
		// ball's mass are expressed in relative units, where 1.0f is
		// the baseline and default.  Older tables that were designed
		// before these properties existed won't be affected since we'll
		// multiply the legacy calculation by 1.0/1.0 == 1.0.  (Set an
		// arbitrary lower bound to prevent division by zero and/or crazy
		// physics.)
		const ballMass = ball.data.mass > 0.05 ? ball.data.mass : 0.05;
		const xferRatio = this.data.momentumXfer / ballMass;
		const deltaY = this.mover.speed * xferRatio;

		// check the moving bits
		newTime = this.mover.lineSegEnd.hitTest(ball, hitTime, hit);
		if (newTime >= 0 && newTime <= hitTime) {
			isHit = true;
			hitTime = newTime;
			coll.set(hit);
			coll.hitVel.set(0, deltaY);
		}

		for (let i = 0; i < 2; i++) {
			newTime = this.mover.jointEnd[i].hitTest(ball, hitTime, hit);
			if (newTime >= 0 && newTime <= hitTime) {
				isHit = true;
				hitTime = newTime;
				coll.set(hit);
				coll.hitVel.set(0, deltaY);
			}
		}

		// restore the original ball velocity (WARNING! CONST POINTER OVERRIDE!)
		ball.hit.vel.y = oldVelY;
		CollisionEvent.release(hit);

		// check for a hit
		if (isHit) {
			// We hit the ball.  Set a travel limit to freeze the plunger at
			// its current position for the next displacement update.  This
			// is necessary in case we have a relatively heavy ball with a
			// relatively light plunger, in which case the ball won't speed
			// up to the plunger's current speed.  Freezing the plunger here
			// prevents the plunger from overtaking the ball.  This serves
			// two purposes, one physically meaningful and the other a bit of
			// a hack for the physics loop.  The physical situation is that we
			// have a slow-moving ball blocking a fast-moving plunger; this
			// momentary travel limit effectively models the blockage.  The
			// hack is that the physics loop can't handle a situation where
			// a moving object is in continuous contact with the ball.  The
			// physics loop is written so that time only advances as far as
			// the next collision.  This means that the loop will get stuck
			// if two objects remain in continuous contact, because the time
			// to the next collision will be exactly 0.0 as long as the contact
			// continues.  We *have* to break the contact for time to progress
			// in the loop.  This has never been a problem for other objects
			// because other collisions always impart enough momentum to send
			// the colliding objects on their separate ways.  With a low
			// momentum transfer ratio in the plunger, though, we can find
			// ourselves pushing the ball along, with the spring keeping the
			// plunger pressed against the ball the whole way.  The plunger
			// freeze here deals with this by breaking contact for just long
			// enough to let the ball move a little bit, so that there's a
			// non-zero time to the next collision with the plunger.  We'll
			// then catch up again and push it along a little further.
			if (this.mover.travelLimit < this.mover.pos) {
				this.mover.travelLimit = this.mover.pos; // HACK
			}

			// If the distance is negative, it means the objects are
			// overlapping.  Make certain that we give the ball enough
			// of an impulse to get it not to overlap.
			if (coll.hitDistance <= 0.0
				&& coll.hitVel!.y === deltaY
				&& Math.abs(deltaY) < Math.abs(coll.hitDistance)) {
				coll.hitVel!.y = -Math.abs(coll.hitDistance);
			}

			// return the collision time delta
			return hitTime;

		} else {
			// no collision
			return -1.0;
		}
	}

	public collide(coll: CollisionEvent, physics: PlayerPhysics): void {
		const ball = coll.ball;

		let dot = (ball.hit.vel.x - coll.hitVel!.x) * coll.hitNormal.x + (ball.hit.vel.y - coll.hitVel!.y) * coll.hitNormal.y;
		if (dot >= -C_LOWNORMVEL) {                        // nearly receding ... make sure of conditions
			if (dot > C_LOWNORMVEL) {                      // otherwise if clearly approaching .. process the collision
				return;                                    // is this velocity clearly receding (i.e must > a minimum)
			}
//#ifdef C_EMBEDDED
			if (coll.hitDistance < -C_EMBEDDED) {
				dot = -C_EMBEDSHOT;                        // has ball become embedded? give it a kick
			} else {
				return;
			}
//#endif
		}
		physics.activeBallBC = ball;                       // Ball control most recently collided with plunger

//#ifdef C_DISP_GAIN
		// correct displacements, mostly from low velocity blidness, an alternative to true acceleration processing
		let hDist = -C_DISP_GAIN * coll.hitDistance;       // distance found in hit detection
		if (hDist > 1.0e-4) {
			if (hDist > C_DISP_LIMIT) {
				hDist = C_DISP_LIMIT;
			}                                              // crossing ramps, delta noise
			// push along norm, back to free area (use the norm, but is not correct)
			ball.state.pos.addAndRelease(coll.hitNormal.clone(true).multiplyScalar(hDist));
		}
//#endif

		// figure the basic impulse
		const impulse = dot * -1.45 / (1.0 + 1.0 / this.mover.mass);

		// We hit the ball, so attenuate any plunger bounce we have queued up
		// for a Fire event.  Real plungers bounce quite a bit when fired without
		// hitting anything, but bounce much less when they hit something, since
		// most of the momentum gets transfered out of the plunger and to the ball.
		this.mover.fireBounce *= 0.6;

		// Check for a downward collision with the tip.  This is the moving
		// part of the plunger, so it has some special handling.
		if (coll.hitVel!.y !== 0.0) {
			// The tip hit the ball (or vice versa).
			//
			// Figure the reverse impulse to the plunger.  If the ball was moving
			// and the plunger wasn't, a little of the ball's momentum should
			// transfer to the plunger.  (Ideally this would just fall out of the
			// momentum calculations organically, the way it works in real life,
			// but our physics are pretty fake here.  So we add a bit to the
			// fakeness here to make it at least look a little more realistic.)
			//
			// Figure the reverse impulse as the dot product times the ball's
			// y velocity, multiplied by the ratio between the ball's collision
			// mass and the plunger's nominal mass.  In practice this is *almost*
			// satisfyingly realistic, but the bump seems a little too big.  So
			// apply a fudge factor to make it look more real.  The fudge factor
			// isn't entirely unreasonable physically - you could look at it as
			// accounting for the spring tension and friction.
			const reverseImpulseFudgeFactor = .22;
			this.mover.reverseImpulse = ball.hit.vel.y * impulse
				* (ball.data.mass / this.mover.mass)
				* reverseImpulseFudgeFactor;
		}

		// update the ball speed for the impulse
		ball.hit.vel.addAndRelease(coll.hitNormal.clone(true).multiplyScalar(impulse));
		ball.hit.vel.multiplyScalar(0.999);           //friction all axiz     //!! TODO: fix this

		const scatterVel = this.mover.scatterVelocity; // fixme * g_pplayer->m_ptable->m_globalDifficulty;// apply dificulty weighting

		if (scatterVel > 0 && Math.abs(ball.hit.vel.y) > scatterVel) {         // skip if low velocity
			let scatter = Math.random() * 2 - 1;                               // -1.0f..1.0f
			scatter *= (1.0 - scatter * scatter) * 2.59808 * scatterVel;       // shape quadratic distribution and scale
			ball.hit.vel.y += scatter;
		}
	}
}
