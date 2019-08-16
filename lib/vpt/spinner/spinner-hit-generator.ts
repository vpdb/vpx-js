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

import { degToRad } from '../../math/float';
import { Vertex2D } from '../../math/vertex2d';
import { HitCircle } from '../../physics/hit-circle';
import { SpinnerData } from './spinner-data';
import { SpinnerState } from './spinner-state';

export class SpinnerHitGenerator {

	private readonly data: SpinnerData;

	constructor(data: SpinnerData) {
		this.data = data;
	}

	public getHitShapes(state: SpinnerState, height: number): HitCircle[] {

		const h = this.data.height + 30.0;

		// correct angle inversions
		const angleMin = Math.min(this.data.angleMin, this.data.angleMax);
		const angleMax = Math.max(this.data.angleMin, this.data.angleMax);
		this.data.angleMin = angleMin;
		this.data.angleMax = angleMax;

		if (this.data.showBracket) {
			/*add a hit shape for the bracket if shown, just in case if the bracket spinner height is low enough so the ball can hit it*/
			const halfLength = this.data.length * 0.5 + (this.data.length * 0.1875);
			const radAngle = degToRad(this.data.rotation);
			const sn = Math.sin(radAngle);
			const cs = Math.cos(radAngle);

			return [
				new HitCircle(
					new Vertex2D(this.data.vCenter.x + cs * halfLength, this.data.vCenter.y + sn * halfLength),
					this.data.length * 0.075,
					height + this.data.height,
					height + h,
				),
				new HitCircle(
					new Vertex2D(this.data.vCenter.x - cs * halfLength, this.data.vCenter.y - sn * halfLength),
					this.data.length * 0.075,
					height + this.data.height,
					height + h,
				),
			];
		}
		return [];
	}
}
