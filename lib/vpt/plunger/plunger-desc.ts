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

import { PlungerCoord } from './plunger-coord';
import { PlungerData } from './plunger-data';

/**
 * Plunger 3D shape descriptor
 */
export class PlungerDesc {

	/**
	 * Number of coordinates in the lathe list.  If there are no
	 * lathe points, this is the flat plunger, which we draw as
	 * an alpha image on a simple flat rectangular surface.
	 */
	public n: number;

	/**
	 * list of lathe coordinates
	 */
	public c: PlungerCoord[];

	constructor(n: number, c: PlungerCoord[]) {
		this.n = n;
		this.c = c;
	}

	public static getModern(): PlungerDesc {
		const modernCoords = [
			new PlungerCoord(0.20, 0.0, 0.00, 1.0, 0.0),  // tip
			new PlungerCoord(0.30, 3.0, 0.11, 1.0, 0.0),  // tip
			new PlungerCoord(0.35, 5.0, 0.14, 1.0, 0.0),  // tip
			new PlungerCoord(0.35, 23.0, 0.19, 1.0, 0.0),  // tip
			new PlungerCoord(0.45, 23.0, 0.21, 0.8, 0.0),  // ring
			new PlungerCoord(0.25, 24.0, 0.25, 0.3, 0.0),  // shaft
			new PlungerCoord(0.25, 100.0, 1.00, 0.3, 0.0),   // shaft
		];
		return new PlungerDesc(modernCoords.length, modernCoords);
	}

	public static getFlat(): PlungerDesc {
		return new PlungerDesc(0, []);
	}

	public static getCustom(data: PlungerData, beginY: number, springMinSpacing: number): CustomDescResult {

		let i: number;

		// Several of the entries are fixed:
		//   shaft x 2 (top, bottom)
		//   ring x 6 (inner top, outer top x 2, outer bottom x 2, inner bottom)
		//   ring gap x 2 (top, bottom)
		//   tip bottom inner x 1
		//   first entry in custom tip list (there's always at least one;
		//   even if it's blank, we read the empty entry as "0,0"
		let nn = 2 + 6 + 2 + 1 + 1;

		// Count entries in the tip list.  Entries are separated
		// by semicolons.
		const tipShapes = data.szTipShape ? data.szTipShape.split(';') : [];
		const nTip = tipShapes.length;
		nn += tipShapes.length;

		// allocate the descriptor and the coordinate array
		const desc = new PlungerDesc(nn, []);
		for (i = 0; i < nn; i++) {
			desc.c.push(new PlungerCoord(0.0, 0.0, 0.0, 0.0, 1.0));
		}

		// figure the tip lathe descriptor from the shape point list

		//const c = customDesc.c;
		//const PlungerCoord *cprv = &c0;
		let tipLen = 0;
		for (i = 0; i < tipShapes.length; i++) {
			const tipShape = tipShapes[i];

			// Parse the entry: "yOffset, diam".  yOffset is the
			// offset (in table distance units) from the previous
			// point.  "diam" is the diameter (relative to the
			// nominal width of the plunger, as given by the width
			// property) of the tip at this point.  1.0 means that
			// the diameter is the same as the nominal width; 0.5
			// is half the width.
			const ts = tipShape.trim().split(' ');
			const yOffset = parseInt(ts[0], 10);
			const diam = parseFloat(ts[1]);
			const c = desc.c[i];

			c.y = yOffset;
			c.r = diam / 2.0;

			// each entry has to have a higher y value than the last
			if (c.y < tipLen) {
				c.y = tipLen;
			}

			// update the tip length so far
			tipLen = c.y;
		}

		// Figure the normals and the texture coordinates
		let cprv = new PlungerCoord(0.0, 0.0, 0.0, 0.0, 1.0);
		for (i = 0; i < tipShapes.length; i++) {
			const c = desc.c[i];

			// Figure the texture coordinate.  The tip is always
			// the top 25% of the overall texture; interpolate the
			// current lathe point's position within that 25%.
			c.tv = 0.24 * c.y / tipLen;

			// Figure the normal as the average of the surrounding
			// surface normals.
			const cnxt = desc.c[i + 1 < nTip ? i + 1 : i];
			const x0 = cprv.r;
			const y0 = cprv.y;
			const x1 = cnxt.r;
			const y1 = cnxt.y;
			const th = Math.atan2(y1 - y0, (x1 - x0) * data.width);
			c.nx = Math.sin(th);
			c.ny = -Math.cos(th);

			cprv = c;
		}

		// add the inner edge of the tip (abutting the rod)
		const rRod = data.rodDiam / 2.0;
		let y = tipLen;
		desc.c[i++].set(rRod, y, 0.24, 1.0, 0.0);

		// add the gap between tip and ring (texture is in the rod
		// quadrant of overall texture, 50%-75%)
		desc.c[i++].set(rRod, y, 0.51, 1.0, 0.0);
		y += data.ringGap;
		desc.c[i++].set(rRod, y, 0.55, 1.0, 0.0);

		// add the ring (texture is in the ring quadrant, 25%-50%)
		const rRing = data.ringDiam / 2.0;
		desc.c[i++].set(rRod, y, 0.26, 0.0, -1.0);
		desc.c[i++].set(rRing, y, 0.33, 0.0, -1.0);
		desc.c[i++].set(rRing, y, 0.33, 1.0, 0.0);

		// noinspection JSSuspiciousNameCombination
		y += data.ringWidth;
		desc.c[i++].set(rRing, y, 0.42, 1.0, 0.0);
		desc.c[i++].set(rRing, y, 0.42, 0.0, 1.0);
		desc.c[i++].set(rRod, y, 0.49, 0.0, 1.0);

		// set the spring values from the properties
		const springRadius = data.springDiam / 2.0;
		const springGauge = data.springGauge;
		const springLoops = data.springLoops;
		const springEndLoops = data.springEndLoops;

		// add the top of the shaft (texture is in the 50%-75% quadrant)
		desc.c[i++].set(rRod, y, 0.51, 1.0, 0.0);

		// Figure the fully compressed spring length.  This is
		// the lower bound for the rod length.
		const springMin = (springLoops + springEndLoops) * springMinSpacing;

		// Figure the rod bottom position (rody).  This is the fully
		// retracted tip position (beginy), plus the length of the parts
		// at the end that don't compress with the spring (y), plus the
		// fully retracted spring length.
		const rody = beginY + y + springMin;
		desc.c[i].set(rRod, rody, 0.74, 1.0, 0.0);

		return {
			desc,
			springRadius,
			springGauge,
			springLoops,
			springEndLoops,
			rody,
		};
	}
}

export interface CustomDescResult {
	desc: PlungerDesc;
	springRadius: number;
	springGauge: number;
	springLoops: number;
	springEndLoops: number;
	rody: number;
}
