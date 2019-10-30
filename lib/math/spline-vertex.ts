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

import { CatmullCurve2D } from './catmull-curve';
import { DragPoint } from './dragpoint';
import { f4 } from './float';
import { RenderVertex, Vertex2D } from './vertex2d';

export class SplineVertex {
	/** number of vertices for the central curve */
	public pcvertex!: number;

	/** true if i-th vertex corresponds to a control point */
	public ppfCross: boolean[] = [];

	/** vertices forming the 2D outline of the ramp */
	public pMiddlePoints: Vertex2D[] = [];

	public rgvLocal: Vertex2D[] = [];

	public static getInstance(
		dragPoints: DragPoint[],
		thickness: number,
		tableDetailLevel: number,
		accuracy: number,
		staticRendering = true,
	): SplineVertex {
		const v = new SplineVertex();
		const vvertex = SplineVertex.getCentralCurve(dragPoints, tableDetailLevel, accuracy, staticRendering);

		const cvertex = vvertex.length;

		for (let i = 0; i < cvertex; i++) {
			// prev and next wrap around as rubbers always loop
			const vprev = vvertex[i > 0 ? i - 1 : cvertex - 1];
			const vnext = vvertex[i < cvertex - 1 ? i + 1 : 0];
			const vmiddle = vvertex[i];

			v.ppfCross[i] = vmiddle.fControlPoint;

			let vNormal: Vertex2D;

			// Get normal at this point
			// Notice that these values equal the ones in the line
			// equation and could probably be substituted by them.
			const v1Normal = new Vertex2D(vprev.y - vmiddle.y, vmiddle.x - vprev.x); // vector vmiddle-vprev rotated RIGHT
			const v2Normal = new Vertex2D(vmiddle.y - vnext.y, vnext.x - vmiddle.x); // vector vnext-vmiddle rotated RIGHT

			// not needed special start/end handling as rubbers always loop, except for the case where there are only 2 control points
			if (cvertex === 2 && i === cvertex - 1) {
				v1Normal.normalize();
				vNormal = v1Normal;
			} else if (cvertex === 2 && i === 0) {
				v2Normal.normalize();
				vNormal = v2Normal;
			} else {
				v1Normal.normalize();
				v2Normal.normalize();

				if (Math.abs(v1Normal.x - v2Normal.x) < 0.0001 && Math.abs(v1Normal.y - v2Normal.y) < 0.0001) {
					// Two parallel segments
					vNormal = v1Normal;
				} else {
					// Find intersection of the two edges meeting this points, but
					// shift those lines outwards along their normals

					// First line
					const A = f4(vprev.y - vmiddle.y);
					const B = f4(vmiddle.x - vprev.x);

					// Shift line along the normal
					const C = f4(f4(A * f4(v1Normal.x - vprev.x)) + f4(B * f4(v1Normal.y - vprev.y)));

					// Second line
					const D = f4(vnext.y - vmiddle.y);
					const E = f4(vmiddle.x - vnext.x);

					// Shift line along the normal
					const F = f4(f4(D * f4(v2Normal.x - vnext.x)) + f4(E * f4(v2Normal.y - vnext.y)));

					const det = f4(f4(A * E) - f4(B * D));
					const invDet = det !== 0.0 ? f4(1.0 / det) : 0.0;

					const intersectX = f4(f4(f4(B * F) - f4(E * C)) * invDet);
					const intersectY = f4(f4(f4(C * D) - f4(A * F)) * invDet);

					vNormal = new Vertex2D(vmiddle.x - intersectX, vmiddle.y - intersectY);
				}
			}

			const widthcur = thickness;

			v.pMiddlePoints[i] = vmiddle;

			// vmiddle + (widthcur * 0.5) * vnormal;
			v.rgvLocal[i] = vmiddle.clone().add(vNormal.clone().multiplyScalar(widthcur * 0.5));

			//vmiddle - (widthcur*0.5f) * vnormal;
			v.rgvLocal[(cvertex + 1) * 2 - i - 1] = vmiddle.clone().sub(vNormal.clone().multiplyScalar(widthcur * 0.5));

			if (i === 0) {
				v.rgvLocal[cvertex] = v.rgvLocal[0];
				v.rgvLocal[(cvertex + 1) * 2 - cvertex - 1] = v.rgvLocal[(cvertex + 1) * 2 - 1];
			}
		}

		v.ppfCross[cvertex] = vvertex[0].fControlPoint;
		v.pMiddlePoints[cvertex] = v.pMiddlePoints[0];
		v.pcvertex = cvertex + 1;

		return v;
	}

	public static getCentralCurve(
		dragPoints: DragPoint[],
		tableDetailLevel: number,
		acc: number,
		staticRendering = true,
	): RenderVertex[] {
		let accuracy: number;

		// as solid rubbers are rendered into the static buffer, always use maximum precision
		if (acc !== -1.0) {
			accuracy = acc; // used for hit shape calculation, always!
		} else {
			if (staticRendering) {
				accuracy = 10.0;
			} else {
				accuracy = tableDetailLevel;
			}
			accuracy = 4.0 * Math.pow(10.0, (10.0 - accuracy) * (1.0 / 1.5)); // min = 4 (highest accuracy/detail level), max = 4 * 10^(10/1.5) = ~18.000.000 (lowest accuracy/detail level)
		}
		// FIXME as any
		return DragPoint.getRgVertex<RenderVertex>(
			dragPoints,
			() => new RenderVertex(),
			CatmullCurve2D.fromVertex2D as any,
			true,
			accuracy,
		);
	}
}
