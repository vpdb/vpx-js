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
import { degToRad } from '../../math/float';
import { clamp } from '../../math/functions';
import { Vertex2D } from '../../math/vertex2d';
import { CollisionEvent } from '../../physics/collision-event';
import { CollisionType } from '../../physics/collision-type';
import { PHYS_FACTOR, PHYS_SKIN } from '../../physics/constants';
import { HitObject } from '../../physics/hit-object';
import { LineSeg } from '../../physics/line-seg';
import { Ball } from '../ball/ball';
import { SpinnerData } from './spinner-data';
import { SpinnerMover } from './spinner-mover';

export class SpinnerHit extends HitObject {

	private lineseg: LineSeg[] = [];
	private spinnerMover: SpinnerMover;

	constructor(data: SpinnerData, height: number) {
		super();

		const halfLength = data.length * 0.5;

		const radAngle = degToRad(data.rotation);
		const sn = Math.sin(radAngle);
		const cs = Math.cos(radAngle);

		const v1 = new Vertex2D(
			data.vCenter.x - cs * (halfLength + PHYS_SKIN), //through the edge of the
			data.vCenter.y - sn * (halfLength + PHYS_SKIN), //spinner
		);
		const v2 = new Vertex2D(
			data.vCenter.x + cs * (halfLength + PHYS_SKIN), //oversize by the ball radius
			data.vCenter.y + sn * (halfLength + PHYS_SKIN), //this will prevent clipping
		);
		this.lineseg.push(new LineSeg(v1, v2, height, height + (2.0 * PHYS_SKIN), CollisionType.Spinner));
		this.lineseg.push(new LineSeg(v2.clone(), v1.clone(), height, height + (2.0 * PHYS_SKIN), CollisionType.Spinner));

		this.spinnerMover = new SpinnerMover(data);
		this.spinnerMover.angleMax = degToRad(data.angleMax!);
		this.spinnerMover.angleMin = degToRad(data.angleMin!);

		this.spinnerMover.angle = clamp(0.0, this.spinnerMover.angleMin, this.spinnerMover.angleMax);
		this.spinnerMover.anglespeed = 0;
		// compute proper damping factor for physics framerate
		this.spinnerMover.damping = Math.pow(data.damping!, PHYS_FACTOR);

		this.spinnerMover.elasticity = data.elasticity!;
		this.spinnerMover.isVisible = data.fVisible;
	}

	public calcHitBBox(): void {
		// todo
	}

	public collide(coll: CollisionEvent, player: Player): void {
		// todo
	}

	public getType(): CollisionType {
		return CollisionType.Spinner;
	}

	public hitTest(pball: Ball, dtime: number, coll: CollisionEvent, player: Player): number {
		// todo
		return 0;
	}

}
