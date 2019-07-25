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

import { Player } from '../../game/player';
import { CollisionEvent } from '../../physics/collision-event';
import { CollisionType } from '../../physics/collision-type';
import { C_DISP_GAIN, C_DISP_LIMIT, C_EMBEDDED, C_EMBEDSHOT, C_LOWNORMVEL } from '../../physics/constants';
import { HitObject } from '../../physics/hit-object';
import { Table } from '../table';
import { Plunger, PlungerConfig } from './plunger';
import { PlungerData } from './plunger-data';
import { PlungerMover } from './plunger-mover';

export class PlungerHit extends HitObject {

	private readonly plungerMover: PlungerMover;

	constructor(plungerData: PlungerData, cFrames: number, player: Player, table: Table) {
		super();
		const zHeight = table.getSurfaceHeight(plungerData.szSurface, plungerData.center.x, plungerData.center.y);
		const config: PlungerConfig = {
			x: plungerData.center.x - plungerData.width,
			y: plungerData.center.y + plungerData.height,
			x2: plungerData.center.x + plungerData.width,
			zHeight,
			frameTop: plungerData.center.y - plungerData.stroke!,
			frameBottom: plungerData.center.y,
			cFrames,
		};

		this.hitBBox.zlow = config.zHeight;
		this.hitBBox.zhigh = config.zHeight + Plunger.PLUNGER_HEIGHT;

		this.plungerMover = new PlungerMover(config, plungerData, player, table.data!);
	}

	public calcHitBBox(): void {
		// Allow roundoff
		this.hitBBox.left = this.plungerMover.x - 0.1;
		this.hitBBox.right = this.plungerMover.x2 + 0.1;
		this.hitBBox.top = this.plungerMover.frameEnd - 0.1;
		this.hitBBox.bottom = this.plungerMover.y + 0.1;

		// zlow & zhigh gets set in constructor
	}

	public collide(coll: CollisionEvent, player: Player): void {
		const pball = coll.ball;

		let dot = (pball.state.vel.x - coll.hitVel!.x) * coll.hitNormal!.x + (pball.state.vel.y - coll.hitVel!.y) * coll.hitNormal!.y;

		if (dot >= -C_LOWNORMVEL) {              // nearly receding ... make sure of conditions
			// otherwise if clearly approaching .. process the collision
			if (dot > C_LOWNORMVEL) {   // is this velocity clearly receding (i.e must > a minimum)
				return;
			}
			if (coll.hitDistance < -C_EMBEDDED) {
				dot = -C_EMBEDSHOT;             // has ball become embedded???, give it a kick
			} else {
				return;
			}
		}
		player.pactiveballBC = pball; // Ball control most recently collided with plunger

		// correct displacements, mostly from low velocity blidness, an alternative to true acceleration processing
		let hdist = -C_DISP_GAIN * coll.hitDistance;         // distance found in hit detection
		if (hdist > 1.0e-4) {
			if (hdist > C_DISP_LIMIT) {
				hdist = C_DISP_LIMIT;
			}                                         // crossing ramps, delta noise
			pball.state.pos.add(coll.hitNormal!.clone().multiplyScalar(hdist));    // push along norm, back to free area (use the norm, but is not correct)
		}

		// figure the basic impulse
		const impulse = dot * -1.45 / (1.0 + 1.0 / this.plungerMover.mass);

		// We hit the ball, so attenuate any plunger bounce we have queued up
		// for a Fire event.  Real plungers bounce quite a bit when fired without
		// hitting anything, but bounce much less when they hit something, since
		// most of the momentum gets transfered out of the plunger and to the ball.
		this.plungerMover.fireBounce *= 0.6;

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
			this.plungerMover.reverseImpulse = pball.state.vel.y * impulse
				* (pball.data.mass / this.plungerMover.mass)
				* reverseImpulseFudgeFactor;
		}

		// update the ball speed for the impulse
		pball.state.vel.add(coll.hitNormal!.clone().multiplyScalar(impulse));

		pball.state.vel.multiplyScalar(0.999);           //friction all axiz     //!! TODO: fix this

		const scatterVel = this.plungerMover.scatterVelocity; // fixme * g_pplayer->m_ptable->m_globalDifficulty;// apply dificulty weighting

		if (scatterVel > 0 && Math.abs(pball.state.vel.y) > scatterVel) { //skip if low velocity
			let scatter = Math.random() * 2 - 1;                                                   // -1.0f..1.0f
			scatter *= (1.0 - scatter * scatter) * 2.59808 * scatterVel;     // shape quadratic distribution and scale
			pball.state.vel.y += scatter;
		}
	}

	public getMoverObject(): PlungerMover {
		return this.plungerMover;
	}

	public getType(): CollisionType {
		return CollisionType.Plunger;
	}
}
