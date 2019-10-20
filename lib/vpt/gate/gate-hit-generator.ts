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
import { Vertex2D } from '../../math/vertex2d';
import { PHYS_SKIN } from '../../physics/constants';
import { HitCircle } from '../../physics/hit-circle';
import { LineSeg } from '../../physics/line-seg';
import { GateData } from './gate-data';
import { GateHit } from './gate-hit';
import { GateState } from './gate-state';

export class GateHitGenerator {

	private readonly data: GateData;

	constructor(data: GateData) {
		this.data = data;
	}

	public generateLineSegs(events: EventProxy, height: number, tangent: Vertex2D): LineSeg[] {

		if (this.data.twoWay) {
			return [];
		}
		const halfLength = this.data.length * 0.5;
		const angleMin = Math.min(this.data.angleMin, this.data.angleMax);     // correct angle inversions
		const angleMax = Math.max(this.data.angleMin, this.data.angleMax);

		this.data.angleMin = angleMin;
		this.data.angleMax = angleMax;

		const rgv: Vertex2D[] = [ //oversize by the ball's radius to prevent the ball from clipping through
			this.data.center.clone().addAndRelease(tangent.clone(true).multiplyScalar(halfLength + PHYS_SKIN)),
			this.data.center.clone().subAndRelease(tangent.clone(true).multiplyScalar(halfLength + PHYS_SKIN)),
		];
		const lineSeg = new LineSeg(rgv[0], rgv[1], height, height + 2.0 * PHYS_SKIN); //!! = ball diameter

		lineSeg.setElasticity(this.data.elasticity);
		lineSeg.setFriction(this.data.friction);
		//lineSeg.setScatter(degToRad(this.data.scatter); // data doesn't contain scatter, at least not from the .vpx.

		return [ lineSeg ];
	}

	public generateGateHit(state: GateState, events: EventProxy, height: number): GateHit {
		const hit = new GateHit(this.data, state, events, height);
		hit.twoWay = this.data.twoWay;
		hit.obj = events;
		hit.fe = true;
		hit.isEnabled = this.data.isCollidable;
		return hit;
	}

	public generateBracketHits(state: GateState, events: EventProxy, height: number, tangent: Vertex2D): HitCircle[] {
		const halfLength = this.data.length * 0.5;
		if (this.data.showBracket) {
			return [
				new HitCircle(this.data.center.clone().addAndRelease(tangent.clone(true).multiplyScalar(halfLength)), 0.01, height, height + this.data.height),
				new HitCircle(this.data.center.clone().subAndRelease(tangent.clone(true).multiplyScalar(halfLength)), 0.01, height, height + this.data.height),
			];
		} else {
			return [];
		}
	}
}
