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

import { HIT_SHAPE_DETAIL_LEVEL } from '../../math/dragpoint';
import { degToRad, f4 } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { SplineVertex } from '../../math/spline-vertex';
import { Vertex3DNoTex2 } from '../../math/vertex';
import { Vertex3D } from '../../math/vertex3d';
import { FLT_MAX, FLT_MIN, Mesh } from '../mesh';
import { Table } from '../table/table';
import { RubberData } from './rubber-data';

export class RubberMeshGenerator {

	private middlePoint: Vertex3D = new Vertex3D();
	private readonly data: RubberData;

	constructor(data: RubberData) {
		this.data = data;
	}

	public getMeshes(table: Table, acc = -1, createHitShape: boolean = false): Mesh {

		const mesh = new Mesh(`rubber-${this.data.getName()}`);
		const staticRendering = true;
		let accuracy: number;
		if (table.getDetailLevel() < 5) {
			accuracy = 6;

		} else if (table.getDetailLevel() >= 5 && table.getDetailLevel() < 8) {
			accuracy = 8;

		} else {
			accuracy = Math.floor(table.getDetailLevel() * 1.3); // see also below
		}

		// as solid rubbers are rendered into the static buffer, always use maximum precision
		if (staticRendering) {
			accuracy = Math.floor(10.0 * 1.2); // see also above
		}

		if (acc !== -1) { // hit shapes and UI display have the same, static, precision
			accuracy = acc;
		}

		const sv = SplineVertex.getInstance(this.data.dragPoints, this.data.thickness, table.getDetailLevel(), acc !== -1
			? 4.0 * Math.pow(10.0, (10.0 - HIT_SHAPE_DETAIL_LEVEL) * (1.0 / 1.5))
			: -1.0,
		);

		const numRings = sv.pcvertex - 1;
		const numSegments = accuracy;

		const numVertices = numRings * numSegments;
		const numIndices = 6 * numVertices; //m_numVertices*2+2;

		const height = this.data.hitHeight + table.getTableHeight();

		let prevB = new Vertex3D();
		const invNR = f4(1.0 / numRings);
		const invNS = f4(1.0 / numSegments);
		let index = 0;
		for (let i = 0; i < numRings; i++) {

			const i2 = (i === numRings - 1) ? 0 : i + 1;

			const tangent = new Vertex3D(sv.pMiddlePoints[i2].x - sv.pMiddlePoints[i].x, sv.pMiddlePoints[i2].y - sv.pMiddlePoints[i].y, 0.0);

			let binorm: Vertex3D;
			let normal: Vertex3D;
			if (i === 0) {
				const up = new Vertex3D(sv.pMiddlePoints[i2].x + sv.pMiddlePoints[i].x, sv.pMiddlePoints[i2].y + sv.pMiddlePoints[i].y, f4(height * 2.0));
				normal = new Vertex3D(tangent.y * up.z, -tangent.x * up.z, f4(tangent.x * up.y) - f4(tangent.y * up.x)); // = CrossProduct(tangent, up)
				binorm = new Vertex3D(tangent.y * normal.z, -tangent.x * normal.z, f4(tangent.x * normal.y) - f4(tangent.y * normal.x)); // = CrossProduct(tangent, normal)

			} else {
				normal = prevB.clone().cross(tangent);
				binorm = tangent.clone().cross(normal);
			}
			binorm.normalize();
			normal.normalize();
			prevB = binorm;
			const u = i * invNR;
			for (let j = 0; j < numSegments; j++) {

				const v = f4(j + u) * invNS;
				const tmp = Vertex3D.getRotatedAxis(j * (360.0 * invNS), tangent, normal).multiplyScalar(this.data.thickness * 0.5);

				mesh.vertices[index] = new Vertex3DNoTex2();
				mesh.vertices[index].x = f4(sv.pMiddlePoints[i].x + tmp.x);
				mesh.vertices[index].y = f4(sv.pMiddlePoints[i].y + tmp.y);
				if (createHitShape && (j === 0 || j === 3)) { //!! hack, adapt if changing detail level for hitshape
					// for a hit shape create a more rectangle mesh and not a smooth one
					tmp.z *= 0.6;
				}
				mesh.vertices[index].z = height + tmp.z;
				//texel
				mesh.vertices[index].tu = u;
				mesh.vertices[index].tv = v;
				index++;
			}
		}

		// calculate faces
		for (let i = 0; i < numRings; i++) {
			for (let j = 0; j < numSegments; j++) {
				const quad: number[] = [];
				quad[0] = i * numSegments + j;

				if (j !== numSegments - 1) {
					quad[1] = i * numSegments + j + 1;
				} else {
					quad[1] = i * numSegments;
				}

				if (i !== numRings - 1) {
					quad[2] = (i + 1) * numSegments + j;
					if (j !== numSegments - 1) {
						quad[3] = (i + 1) * numSegments + j + 1;
					} else {
						quad[3] = (i + 1) * numSegments;
					}
				} else {
					quad[2] = j;
					if (j !== numSegments - 1) {
						quad[3] = j + 1;
					} else {
						quad[3] = 0;
					}
				}
				mesh.indices[(i * numSegments + j) * 6] = quad[0];
				mesh.indices[(i * numSegments + j) * 6 + 1] = quad[1];
				mesh.indices[(i * numSegments + j) * 6 + 2] = quad[2];
				mesh.indices[(i * numSegments + j) * 6 + 3] = quad[3];
				mesh.indices[(i * numSegments + j) * 6 + 4] = quad[2];
				mesh.indices[(i * numSegments + j) * 6 + 5] = quad[1];
			}
		}

		Mesh.computeNormals(mesh.vertices, numVertices, mesh.indices, numIndices);

		let maxx = FLT_MIN;
		let minx = FLT_MAX;
		let maxy = FLT_MIN;
		let miny = FLT_MAX;
		let maxz = FLT_MIN;
		let minz = FLT_MAX;
		for (let i = 0; i < numVertices; i++) {
			if (maxx < mesh.vertices[i].x) { maxx = mesh.vertices[i].x; }
			if (minx > mesh.vertices[i].x) { minx = mesh.vertices[i].x; }
			if (maxy < mesh.vertices[i].y) { maxy = mesh.vertices[i].y; }
			if (miny > mesh.vertices[i].y) { miny = mesh.vertices[i].y; }
			if (maxz < mesh.vertices[i].z) { maxz = mesh.vertices[i].z; }
			if (minz > mesh.vertices[i].z) { minz = mesh.vertices[i].z; }
		}
		this.middlePoint.x = f4(maxx + minx) * 0.5;
		this.middlePoint.y = f4(maxy + miny) * 0.5;
		this.middlePoint.z = f4(maxz + minz) * 0.5;

		const [vertexMatrix, fullMatrix ] = this.getMatrices(table);
		return mesh.transform(vertexMatrix, fullMatrix);
	}

	private getMatrices(table: Table): [ Matrix3D, Matrix3D ] {
		const fullMatrix = new Matrix3D();
		const tempMat = new Matrix3D();
		fullMatrix.rotateZMatrix(degToRad(this.data.rotZ));
		tempMat.rotateYMatrix(degToRad(this.data.rotY));
		fullMatrix.multiply(tempMat);
		tempMat.rotateXMatrix(degToRad(this.data.rotX));
		fullMatrix.multiply(tempMat);

		const vertMatrix = new Matrix3D();
		tempMat.setTranslation(-this.middlePoint.x, -this.middlePoint.y, -this.middlePoint.z);
		vertMatrix.multiply(tempMat, fullMatrix);
		tempMat.setScaling(1.0, 1.0, table.getScaleZ());
		vertMatrix.multiply(tempMat);
		if (this.data.height === this.data.hitHeight) {   // do not z-scale the hit mesh
			tempMat.setTranslation(this.middlePoint.x, this.middlePoint.y, this.data.height + table.getTableHeight());
		} else {
			tempMat.setTranslation(this.middlePoint.x, this.middlePoint.y, f4(this.data.height * table.getScaleZ()) + table.getTableHeight());
		}
		vertMatrix.multiply(tempMat);

		return [ vertMatrix, fullMatrix ];
	}
}
