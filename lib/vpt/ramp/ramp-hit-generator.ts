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

import { Vertex2D } from '../../math/vertex2d';
import { Vertex3D } from '../../math/vertex3d';
import { HIT_SHAPE_DETAIL_LEVEL, PHYS_SKIN } from '../../physics/constants';
import { HitLine3D } from '../../physics/hit-line-3d';
import { HitLineZ } from '../../physics/hit-line-z';
import { HitObject } from '../../physics/hit-object';
import { HitTriangle } from '../../physics/hit-triangle';
import { LineSeg } from '../../physics/line-seg';
import { Table } from '../table/table';
import { Ramp } from './ramp';
import { RampData } from './ramp-data';
import { RampMeshGenerator } from './ramp-mesh-generator';

export class RampHitGenerator {

	private readonly data: RampData;
	private readonly meshGenerator: RampMeshGenerator;

	constructor(data: RampData, meshGenerator: RampMeshGenerator) {
		this.data = data;
		this.meshGenerator = meshGenerator;
	}

	public generateHitObjects(table: Table): HitObject[] {

		const hitObjects: HitObject[] = [];
		const rv = this.meshGenerator.getRampVertex(table, HIT_SHAPE_DETAIL_LEVEL, true);
		const rgvLocal = rv.rgvLocal;
		const rgHeight1 = rv.ppheight;
		const cVertex = rv.pcvertex;

		let wallHeightRight: number;
		let wallHeightLeft: number;

		switch (this.data.rampType) {
			case Ramp.RampTypeFlat:
				wallHeightRight = this.data.rightWallHeight;
				wallHeightLeft = this.data.leftWallHeight;
				break;
			case Ramp.RampType1Wire:
				// backwards compatible physics
				wallHeightRight = 31.0;
				wallHeightLeft = 31.0;
				break;
			case Ramp.RampType2Wire:
				// backwards compatible physics
				wallHeightRight = 31.0;
				wallHeightLeft = 31.0;
				break;
			case Ramp.RampType4Wire:
				wallHeightRight = 62.0;
				wallHeightLeft = 62.0;
				break;
			case Ramp.RampType3WireRight:
				wallHeightRight = 62.0;
				wallHeightLeft = (6 + 12.5);
				break;
			case Ramp.RampType3WireLeft:
				wallHeightRight = (6 + 12.5);
				wallHeightLeft = 62.0;
				break;
				/* istanbul ignore next: let's assume this doesn't happen! */
			default:
				throw new Error(`Unknown ramp type "${this.data.rampType}".`);
		}

		let pv1: Vertex2D = new Vertex2D();
		let pv2: Vertex2D = new Vertex2D();
		let pv3: Vertex2D = new Vertex2D();
		let pv4: Vertex2D = new Vertex2D();
		let rgv3D: Vertex3D[];
		let ph3dpoly: HitTriangle;

		// Add line segments for right ramp wall.
		if (wallHeightRight > 0) {
			for (let i = 0; i < (cVertex - 1); i++) {
				pv2 = rgvLocal[i];
				pv3 = rgvLocal[i + 1];

				hitObjects.push(...this.generateWallLineSeg(pv2, pv3, (i > 0), rgHeight1[i], rgHeight1[i + 1], wallHeightRight));
				hitObjects.push(...this.generateWallLineSeg(pv3, pv2, (i < (cVertex - 2)), rgHeight1[i], rgHeight1[i + 1], wallHeightRight));

				// add joints at start and end of right wall
				if (i === 0) {
					hitObjects.push(this.generateJoint2D(pv2, rgHeight1[0], rgHeight1[0] + wallHeightRight));
				}
				if (i === cVertex - 2) {
					hitObjects.push(this.generateJoint2D(pv3, rgHeight1[cVertex - 1], rgHeight1[cVertex - 1] + wallHeightRight));
				}
			}
		}

		// Add line segments for left ramp wall.
		if (wallHeightLeft > 0) {
			for (let i = 0; i < (cVertex - 1); i++) {
				pv2 = rgvLocal[cVertex + i];
				pv3 = rgvLocal[cVertex + i + 1];

				hitObjects.push(...this.generateWallLineSeg(pv2, pv3, (i > 0), rgHeight1[cVertex - i - 2], rgHeight1[cVertex - i - 1], wallHeightLeft));
				hitObjects.push(...this.generateWallLineSeg(pv3, pv2, (i < (cVertex - 2)), rgHeight1[cVertex - i - 2], rgHeight1[cVertex - i - 1], wallHeightLeft));

				// add joints at start and end of left wall
				if (i === 0) {
					hitObjects.push(this.generateJoint2D(pv2, rgHeight1[cVertex - 1], rgHeight1[cVertex - 1] + wallHeightLeft));
				}
				if (i === cVertex - 2) {
					hitObjects.push(this.generateJoint2D(pv3, rgHeight1[0], rgHeight1[0] + wallHeightLeft));
				}
			}
		}

		// Add hit triangles for the ramp floor.
		let ph3dpolyOld!: HitTriangle;

		for (let i = 0; i < (cVertex - 1); i++) {
			/*
			 * Layout of one ramp quad seen from above, ramp direction is bottom to top:
			 *
			 *    3 - - 4
			 *    | \   |
			 *    |   \ |
			 *    2 - - 1
			 */
			pv1 = rgvLocal[i];                   // i-th right
			pv2 = rgvLocal[cVertex * 2 - i - 1]; // i-th left
			pv3 = rgvLocal[cVertex * 2 - i - 2]; // (i+1)-th left
			pv4 = rgvLocal[i + 1];               // (i+1)-th right

			// left ramp floor triangle, CCW order
			rgv3D = [
				new Vertex3D(pv2.x, pv2.y, rgHeight1[i]),
				new Vertex3D(pv1.x, pv1.y, rgHeight1[i]),
				new Vertex3D(pv3.x, pv3.y, rgHeight1[i + 1]),
			];

			// add joint for starting edge of ramp
			if (i === 0) {
				hitObjects.push(this.generateJoint(rgv3D[0], rgv3D[1]));
			}

			// add joint for left edge
			hitObjects.push(this.generateJoint(rgv3D[0], rgv3D[2]));

			ph3dpoly = new HitTriangle(rgv3D); //!! this is not efficient at all, use native triangle-soup directly somehow

			if (!ph3dpoly.isDegenerate()) {       // degenerate triangles happen if width is 0 at some point
				hitObjects.push(ph3dpoly);

				hitObjects.push(...this.checkJoint(ph3dpolyOld, ph3dpoly));
				ph3dpolyOld = ph3dpoly;
			}

			// right ramp floor triangle, CCW order
			rgv3D = [
				new Vertex3D(pv3.x, pv3.y, rgHeight1[i + 1]),
				new Vertex3D(pv1.x, pv1.y, rgHeight1[i]),
				new Vertex3D(pv4.x, pv4.y, rgHeight1[i + 1]),
			];

			// add joint for right edge
			hitObjects.push(this.generateJoint(rgv3D[1], rgv3D[2]));

			ph3dpoly = new HitTriangle(rgv3D);
			if (!ph3dpoly.isDegenerate()) {
				hitObjects.push(ph3dpoly);

				hitObjects.push(...this.checkJoint(ph3dpolyOld, ph3dpoly));
				ph3dpolyOld = ph3dpoly;
			}
		}

		if (cVertex >= 2) {
			// add joint for final edge of ramp
			const v1 = new Vertex3D(pv4.x, pv4.y, rgHeight1[cVertex - 1]);
			const v2 = new Vertex3D(pv3.x, pv3.y, rgHeight1[cVertex - 1]);
			hitObjects.push(this.generateJoint(v1, v2));
		}

		// add outside bottom,
		// joints at the intersections are not needed since the inner surface has them
		// this surface is identical... except for the direction of the normal face.
		// hence the joints protect both surface edges from having a fall through
		for (let i = 0; i < (cVertex - 1); i++) {
			// see sketch above
			pv1 = rgvLocal[i];
			pv2 = rgvLocal[cVertex * 2 - i - 1];
			pv3 = rgvLocal[cVertex * 2 - i - 2];
			pv4 = rgvLocal[i + 1];

			// left ramp triangle, order CW
			rgv3D = [
				new Vertex3D(pv1.x, pv1.y, rgHeight1[i]),
				new Vertex3D(pv2.x, pv2.y, rgHeight1[i]),
				new Vertex3D(pv3.x, pv3.y, rgHeight1[i + 1]),
			];

			ph3dpoly = new HitTriangle(rgv3D);
			if (!ph3dpoly.isDegenerate()) {
				hitObjects.push(ph3dpoly);
			}

			// right ramp triangle, order CW
			rgv3D = [
				new Vertex3D(pv3.x, pv3.y, rgHeight1[i + 1]),
				new Vertex3D(pv4.x, pv4.y, rgHeight1[i + 1]),
				new Vertex3D(pv1.x, pv1.y, rgHeight1[i]),
			];

			ph3dpoly = new HitTriangle(rgv3D);
			if (!ph3dpoly.isDegenerate()) {
				hitObjects.push(ph3dpoly);
			}
		}

		return hitObjects;
	}

	private generateWallLineSeg(pv1: Vertex2D, pv2: Vertex2D, pv3Exists: boolean, height1: number, height2: number, wallHeight: number): HitObject[] {
		const hitObjects: HitObject[] = [];

		//!! Hit-walls are still done via 2D line segments with only a single lower and upper border, so the wall will always reach below and above the actual ramp -between- two points of the ramp
		// Thus, subdivide until at some point the approximation error is 'subtle' enough so that one will usually not notice (i.e. dependent on ball size)
		if (height2 - height1 > (2.0 * PHYS_SKIN)) { //!! use ballsize
			hitObjects.push(...this.generateWallLineSeg(pv1, pv1.clone().add(pv2).multiplyScalar(0.5), pv3Exists, height1, (height1 + height2) * 0.5, wallHeight));
			hitObjects.push(...this.generateWallLineSeg(pv1.clone().add(pv2).multiplyScalar(0.5), pv2, true, (height1 + height2) * 0.5, height2, wallHeight));

		} else {
			hitObjects.push(new LineSeg(pv1, pv2, height1, height2 + wallHeight));
			if (pv3Exists) {
				hitObjects.push(this.generateJoint2D(pv1, height1, height2 + wallHeight));
			}
		}
		return hitObjects;
	}

	private generateJoint2D(p: Vertex2D, zLow: number, zHigh: number): HitLineZ {
		return new HitLineZ(p, zLow, zHigh);
	}

	private generateJoint(v1: Vertex3D, v2: Vertex3D): HitLine3D {
		return new HitLine3D(v1, v2);
	}

	private checkJoint(ph3d1: HitTriangle, ph3d2: HitTriangle): HitObject[] {
		if (ph3d1) {   // may be null in case of degenerate triangles
			const jointNormal = Vertex3D.crossProduct(ph3d1.normal, ph3d2.normal);
			if (jointNormal.lengthSq() < 1e-8) { // coplanar triangles need no joints
				return [];
			}
		}
		// By convention of the calling function, points 1 [0] and 2 [1] of the second polygon will
		// be the common-edge points
		return [this.generateJoint(ph3d2.rgv[0], ph3d2.rgv[1])];
	}
}
