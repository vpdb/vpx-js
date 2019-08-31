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
import { PlayerPhysics } from '../../game/player-physics';
import { degToRad } from '../../math/float';
import { Vertex2D } from '../../math/vertex2d';
import { CollisionEvent } from '../../physics/collision-event';
import { CollisionType } from '../../physics/collision-type';
import { PHYS_SKIN } from '../../physics/constants';
import { HitObject, HitTestResult } from '../../physics/hit-object';
import { LineSeg } from '../../physics/line-seg';
import { Ball } from '../ball/ball';
import { GateData } from './gate-data';
import { GateMover } from './gate-mover';
import { GateState } from './gate-state';

export class GateHit extends HitObject {

	public readonly mover: GateMover;
	public readonly lineSeg: LineSeg[] = [];
	private readonly data: GateData;

	public twoWay: boolean = false;

	constructor(data: GateData, state: GateState, events: EventProxy, height: number) {
		super();
		this.data = data;

		const halfLength = this.data.length * 0.5;
		const radAngle = degToRad(this.data.rotation);
		const sn = Math.sin(radAngle);
		const cs = Math.cos(radAngle);

		const lineSeg0 = new LineSeg(
			new Vertex2D(this.data.vCenter.x - cs * (halfLength + PHYS_SKIN), this.data.vCenter.y - sn * (halfLength + PHYS_SKIN)),
			new Vertex2D(this.data.vCenter.x + cs * (halfLength + PHYS_SKIN), this.data.vCenter.y + sn * (halfLength + PHYS_SKIN)),
			height,
			height + 2.0 * PHYS_SKIN,
			CollisionType.Gate,
		);
		const lineSeg1 = new LineSeg(
			new Vertex2D(lineSeg0.v2.x, lineSeg0.v2.y),
			new Vertex2D(lineSeg0.v1.x, lineSeg0.v1.y),
			height,
			height + 2.0 * PHYS_SKIN,
			CollisionType.Gate,
		);
		this.lineSeg.push(lineSeg0);
		this.lineSeg.push(lineSeg1);

		this.mover = new GateMover(this.data, state, events);
		this.twoWay = false;
	}

	public getMoverObject(): GateMover {
		return this.mover;
	}

	public calcHitBBox(): void {
		// Bounding rect for both lines will be the same
		this.lineSeg[0].calcHitBBox();
		this.hitBBox = this.lineSeg[0].hitBBox;
	}

	public hitTest(ball: Ball, dTime: number, coll: CollisionEvent, player: PlayerPhysics): HitTestResult {
		if (!this.isEnabled) {
			return {hitTime: -1.0, coll};
		}

		for (let i = 0; i < 2; ++i) {
			const result = this.lineSeg[i].hitTestBasic(ball, dTime, coll, false, true, false); // any face, lateral, non-rigid
			if (result.hitTime >= 0) {
				// signal the Collide() function that the hit is on the front or back side
				coll.hitFlag = !!i;
				return {hitTime: result.hitTime, coll};
			}
		}
		return {hitTime: -1.0, coll};
	}

	public collide(coll: CollisionEvent, player: PlayerPhysics): void {
		const ball = coll.ball;
		const hitNormal = coll.hitNormal!;

		const dot = hitNormal.dot(coll.ball.hit.vel);
		const h = this.data.height * 0.5;

		// linear speed = ball speed
		// angular speed = linear/radius (height of hit)
		let speed = Math.abs(dot);
		// h is the height of the gate axis.
		if (Math.abs(h) > 1.0) {                           // avoid divide by zero
			speed /= h;
		}

		this.mover.angleSpeed = speed;
		if (!coll.hitFlag && !this.twoWay) {
			this.mover.angleSpeed *= 1.0 / 8.0;            // Give a little bounce-back.
			return;                                        // hit from back doesn't count if not two-way
		}

		// We encoded which side of the spinner the ball hit
		if (coll.hitFlag && this.twoWay) {
			this.mover.angleSpeed = -this.mover.angleSpeed;
		}

		this.fireHitEvent(ball);
	}
}
