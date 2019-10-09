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

import { PlayerPhysics } from '../../game/player-physics';
import { Matrix2D } from '../../math/matrix2d';
import { Vertex3D } from '../../math/vertex3d';
import { PHYS_FACTOR } from '../../physics/constants';
import { MoverObject } from '../../physics/mover-object';
import { BallData } from './ball-data';
import { BallHit } from './ball-hit';
import { BallState } from './ball-state';

export class BallMover implements MoverObject {

	private readonly id: number;
	private readonly data: BallData;
	private readonly state: BallState;
	private readonly hit: BallHit;

	constructor(id: number, data: BallData, state: BallState, hit: BallHit) {
		this.id = id;
		this.data = data;
		this.state = state;
		this.hit = hit;
	}

	public updateDisplacements(dtime: number): void {
		if (!this.state.isFrozen) {

			this.state.pos.addAndRelease(this.hit.vel.clone(true).multiplyScalar(dtime));
			this.hit.calcHitBBox();

			const mat3 = Matrix2D.claim().createSkewSymmetric(this.hit.angularVelocity);

			const addedOrientation = Matrix2D.claim();
			addedOrientation.multiplyMatrix(mat3, this.state.orientation);
			addedOrientation.multiplyScalar(dtime);

			this.state.orientation.addMatrix(addedOrientation, this.state.orientation);
			this.state.orientation.orthoNormalize();

			this.hit.angularVelocity.setAndRelease(this.hit.angularMomentum.clone(true).divideScalar(this.hit.inertia));

			Matrix2D.release(mat3, addedOrientation);
		}
	}

	public updateVelocities(physics: PlayerPhysics): void {
		if (!this.state.isFrozen) {

			if (physics.ballControl && this.id === physics.activeBallBC!.id && physics.bcTarget) {
				this.hit.vel.x *= 0.5;  // Null out most of the X/Y velocity, want a little bit so the ball can sort of find its way out of obstacles.
				this.hit.vel.y *= 0.5;

				this.hit.vel.addAndRelease(Vertex3D.claim(
					Math.max(-10.0, Math.min(10.0, (physics.bcTarget.x - this.state.pos.x) / 10.0)),
					Math.max(-10.0, Math.min(10.0, (physics.bcTarget.y - this.state.pos.y) / 10.0)),
					-2.0,
				));
			} else {
				this.hit.vel.addAndRelease(physics.gravity.clone(true).multiplyScalar(PHYS_FACTOR));
			}

			// todo nudge
			// this.hit.vel.x += player.nudgeX; // TODO: depends on STEPTIME
			// this.hit.vel.y += player.nudgeY;
			// this.hit.vel.sub(player.tableVelDelta);
		}

		this.hit.calcHitBBox();
	}
}
