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

import { CatmullCurve3D } from '../../math/catmull-curve';
import { DragPoint } from '../../math/dragpoint';
import { f4 } from '../../math/float';
import { Vertex3DNoTex2 } from '../../math/vertex';
import { Vertex2D } from '../../math/vertex2d';
import { RenderVertex3D, Vertex3D } from '../../math/vertex3d';
import { ImageAlignment, RampType } from '../enums';
import { Mesh } from '../mesh';
import { Table } from '../table/table';
import { RampData } from './ramp-data';

export class RampMeshGenerator {

	private readonly data: RampData;

	constructor(data: RampData) {
		this.data = data;
	}

	public getMeshes(table: Table): RampMeshes {
		const meshes: RampMeshes = {};
		if (!this.isHabitrail()) {
			return this.generateFlatMesh(table);

		} else {
			const [wireMeshA, wireMeshB] = this.generateWireMeshes(table);
			switch (this.data.rampType) {
				case RampType.Wire1: {
					wireMeshA.name = `ramp.wire1-${this.data.getName()}`;
					meshes.wire1 = wireMeshA;
					break;
				}
				case RampType.Wire2: {
					const wire1Mesh = wireMeshA.makeTranslation(0, 0, 3.0);
					const wire2Mesh = wireMeshB.makeTranslation(0, 0, 3.0);
					wire1Mesh.name = `ramp.wire1-${this.data.getName()}`;
					wire2Mesh.name = `ramp.wire2-${this.data.getName()}`;
					meshes.wire1 = wire1Mesh;
					meshes.wire2 = wire2Mesh;
					break;
				}
				case RampType.Wire4: {
					meshes.wire1 = wireMeshA.clone(`ramp.wire1-${this.data.getName()}`).makeTranslation(0, 0, this.data.wireDistanceY * 0.5);
					meshes.wire2 = wireMeshB.clone(`ramp.wire2-${this.data.getName()}`).makeTranslation(0, 0, this.data.wireDistanceY * 0.5);
					meshes.wire3 = wireMeshA.makeTranslation(0, 0, 3.0);
					meshes.wire3.name = `ramp.wire3-${this.data.getName()}`;
					meshes.wire4 = wireMeshB.makeTranslation(0, 0, 3.0);
					meshes.wire4.name = `ramp.wire4-${this.data.getName()}`;
					break;
				}
				case RampType.Wire3Left: {
					meshes.wire2 = wireMeshB.clone(`ramp.wire2-${this.data.getName()}`).makeTranslation(0, 0, this.data.wireDistanceY * 0.5);
					meshes.wire3 = wireMeshA.makeTranslation(0, 0, 3.0);
					meshes.wire3.name = `ramp.wire3-${this.data.getName()}`;
					meshes.wire4 = wireMeshB.makeTranslation(0, 0, 3.0);
					meshes.wire4.name = `ramp.wire4-${this.data.getName()}`;
					break;
				}
				case RampType.Wire3Right: {
					meshes.wire1 = wireMeshA.clone(`ramp.wire1-${this.data.getName()}`).makeTranslation(0, 0, this.data.wireDistanceY * 0.5);
					meshes.wire3 = wireMeshA.makeTranslation(0, 0, 3.0);
					meshes.wire3.name = `ramp.wire3-${this.data.getName()}`;
					meshes.wire4 = wireMeshB.makeTranslation(0, 0, 3.0);
					meshes.wire4.name = `ramp.wire4-${this.data.getName()}`;
					break;
				}
			}
		}
		return meshes;
	}

	private generateFlatMesh(table: Table): RampMeshes {
		const rv = this.getRampVertex(table, -1, true);
		const meshes: RampMeshes = {
			floor: this.generateFlatFloorMesh(table, rv),
		};
		if (this.data.leftWallHeightVisible > 0.0) {
			meshes.left = this.generateFlatLeftWall(table, rv);
		}
		if (this.data.rightWallHeightVisible > 0.0) {
			meshes.right = this.generateFlatRightWall(table, rv);
		}
		return meshes;
	}

	private generateFlatFloorMesh(table: Table, rv: RampVertexResult): Mesh {
		const rampVertex = rv.pcvertex;
		const rgHeight = rv.ppheight;
		const rgRatio = rv.ppratio;
		const dim = table.getDimensions();
		const invTableWidth = f4(1.0 / f4(dim.width));
		const invTableHeight = f4(1.0 / f4(dim.height));
		const numVertices = rv.pcvertex * 2;

		const mesh = new Mesh(`ramp.floor-${this.data.getName()}`);
		for (let i = 0; i < rampVertex; i++) {

			const rgv3d1 = new Vertex3DNoTex2();
			const rgv3d2 = new Vertex3DNoTex2();

			rgv3d1.x = rv.rgvLocal[i].x;
			rgv3d1.y = rv.rgvLocal[i].y;
			rgv3d1.z = rgHeight[i] * table.getScaleZ();

			rgv3d2.x = rv.rgvLocal[rampVertex * 2 - i - 1].x;
			rgv3d2.y = rv.rgvLocal[rampVertex * 2 - i - 1].y;
			rgv3d2.z = rgv3d1.z;

			if (this.data.szImage) {
				if (this.data.imageAlignment === ImageAlignment.ModeWorld) {
					rgv3d1.tu = rgv3d1.x * invTableWidth;
					rgv3d1.tv = rgv3d1.y * invTableHeight;
					rgv3d2.tu = rgv3d2.x * invTableWidth;
					rgv3d2.tv = rgv3d2.y * invTableHeight;

				} else {
					rgv3d1.tu = 1.0;
					rgv3d1.tv = rgRatio[i];
					rgv3d2.tu = 0.0;
					rgv3d2.tv = rgRatio[i];
				}

			} else {
				rgv3d1.tu = 0.0;
				rgv3d1.tv = 0.0;
				rgv3d2.tu = 0.0;
				rgv3d2.tv = 0.0;
			}

			mesh.vertices.push(rgv3d1);
			mesh.vertices.push(rgv3d2);

			if (i === rampVertex - 1) {
				break;
			}

			mesh.indices.push(i * 2);
			mesh.indices.push(i * 2 + 1);
			mesh.indices.push(i * 2 + 3);
			mesh.indices.push(i * 2);
			mesh.indices.push(i * 2 + 3);
			mesh.indices.push(i * 2 + 2);
		}

		Mesh.computeNormals(mesh.vertices, numVertices, mesh.indices, (rampVertex - 1) * 6);
		return mesh;
	}

	private generateFlatLeftWall(table: Table, rv: RampVertexResult): Mesh {
		const rampVertex = rv.pcvertex;
		const rgHeight = rv.ppheight;
		const rgRatio = rv.ppratio;
		const dim = table.getDimensions();
		const invTableWidth = f4(1.0 / f4(dim.width));
		const invTableHeight = f4(1.0 / f4(dim.height));
		const numVertices = rampVertex * 2;

		const mesh = new Mesh(`ramp.left-${this.data.getName()}`);
		for (let i = 0; i < rampVertex; i++) {

			const rgv3d1 = new Vertex3DNoTex2();
			const rgv3d2 = new Vertex3DNoTex2();

			rgv3d1.x = rv.rgvLocal[rampVertex * 2 - i - 1].x;
			rgv3d1.y = rv.rgvLocal[rampVertex * 2 - i - 1].y;
			rgv3d1.z = rgHeight[i] * table.getScaleZ();

			rgv3d2.x = rgv3d1.x;
			rgv3d2.y = rgv3d1.y;
			rgv3d2.z = f4(rgHeight[i] + this.data.leftWallHeightVisible) * table.getScaleZ();

			if (this.data.szImage && this.data.imageWalls) {
				if (this.data.imageAlignment === ImageAlignment.ModeWorld) {
					rgv3d1.tu = rgv3d1.x * invTableWidth;
					rgv3d1.tv = rgv3d1.y * invTableHeight;

				} else {
					rgv3d1.tu = 0;
					rgv3d1.tv = rgRatio[i];
				}
				rgv3d2.tu = rgv3d1.tu;
				rgv3d2.tv = rgv3d1.tv;
			} else {
				rgv3d1.tu = 0.0;
				rgv3d1.tv = 0.0;
				rgv3d2.tu = 0.0;
				rgv3d2.tv = 0.0;
			}

			mesh.vertices.push(rgv3d1);
			mesh.vertices.push(rgv3d2);

			if (i === rampVertex - 1) {
				break;
			}

			mesh.indices.push(i * 2);
			mesh.indices.push(i * 2 + 1);
			mesh.indices.push(i * 2 + 3);
			mesh.indices.push(i * 2);
			mesh.indices.push(i * 2 + 3);
			mesh.indices.push(i * 2 + 2);
		}
		Mesh.computeNormals(mesh.vertices, numVertices, mesh.indices, (rampVertex - 1) * 6);
		return mesh;
	}

	private generateFlatRightWall(table: Table, rv: RampVertexResult): Mesh {
		const rampVertex = rv.pcvertex;
		const rgHeight = rv.ppheight;
		const rgRatio = rv.ppratio;
		const dim = table.getDimensions();
		const invTableWidth = f4(1.0 / f4(dim.width));
		const invTableHeight = f4(1.0 / f4(dim.height));
		const numVertices = rampVertex * 2;

		const mesh = new Mesh(`ramp.right-${this.data.getName()}`);
		for (let i = 0; i < rampVertex; i++) {

			const rgv3d1 = new Vertex3DNoTex2();
			const rgv3d2 = new Vertex3DNoTex2();

			rgv3d1.x = rv.rgvLocal[i].x;
			rgv3d1.y = rv.rgvLocal[i].y;
			rgv3d1.z = rgHeight[i] * table.getScaleZ();

			rgv3d2.x = rv.rgvLocal[i].x;
			rgv3d2.y = rv.rgvLocal[i].y;
			rgv3d2.z = f4(rgHeight[i] + this.data.rightWallHeightVisible) * table.getScaleZ();

			if (this.data.szImage && this.data.imageWalls) {
				if (this.data.imageAlignment === ImageAlignment.ModeWorld) {
					rgv3d1.tu = rgv3d1.x * invTableWidth;
					rgv3d1.tv = rgv3d1.y * invTableHeight;

				} else {
					rgv3d1.tu = 0;
					rgv3d1.tv = rgRatio[i];
				}
				rgv3d2.tu = rgv3d1.tu;
				rgv3d2.tv = rgv3d1.tv;
			} else {
				rgv3d1.tu = 0.0;
				rgv3d1.tv = 0.0;
				rgv3d2.tu = 0.0;
				rgv3d2.tv = 0.0;
			}

			mesh.vertices.push(rgv3d1);
			mesh.vertices.push(rgv3d2);

			if (i === rampVertex - 1) {
				break;
			}

			mesh.indices.push(i * 2);
			mesh.indices.push(i * 2 + 1);
			mesh.indices.push(i * 2 + 3);
			mesh.indices.push(i * 2);
			mesh.indices.push(i * 2 + 3);
			mesh.indices.push(i * 2 + 2);

		}
		Mesh.computeNormals(mesh.vertices, numVertices, mesh.indices, (rampVertex - 1) * 6);
		return mesh;
	}

	private generateWireMeshes(table: Table): Mesh[] {
		const meshes: Mesh[] = [];

		let accuracy;
		if (table.getDetailLevel() < 5) {
			accuracy = 6;
		} else if (table.getDetailLevel() >= 5 && table.getDetailLevel() < 8) {
			accuracy = 8;
		} else {
			accuracy = Math.floor(table.getDetailLevel() * f4(1.3)); // see below
		}

		// as solid ramps are rendered into the static buffer, always use maximum precision
		const mat = table.getMaterial(this.data.szMaterial);
		if (!mat || !mat.isOpacityActive) {
			accuracy = f4(12.0); // see above
		}

		const rv = this.getRampVertex(table, -1, false);
		const splinePoints = rv.pcvertex;
		const rgheightInit = rv.ppheight;
		const middlePoints = rv.pMiddlePoints;

		const numRings = splinePoints;
		const numSegments = accuracy;

		const tmpPoints: Vertex2D[] = [];

		for (let i = 0; i < splinePoints; i++) {
			tmpPoints[i] = rv.rgvLocal[splinePoints * 2 - i - 1];
		}

		let vertBuffer: Vertex3DNoTex2[] = [];
		let vertBuffer2: Vertex3DNoTex2[] = [];

		if (this.data.rampType !== RampType.Wire1) {
			vertBuffer = this.createWire(numRings, numSegments, rv.rgvLocal, rgheightInit);
			vertBuffer2 = this.createWire(numRings, numSegments, tmpPoints, rgheightInit);
		} else {
			vertBuffer = this.createWire(numRings, numSegments, middlePoints, rgheightInit);
		}

		// calculate faces
		const indices: number[] = [];
		for (let i = 0; i < numRings - 1; i++) {
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

				const offs = (i * numSegments + j) * 6;
				indices[offs] = quad[0];
				indices[offs + 1] = quad[1];
				indices[offs + 2] = quad[2];
				indices[offs + 3] = quad[3];
				indices[offs + 4] = quad[2];
				indices[offs + 5] = quad[1];
			}
		}

		meshes.push(new Mesh(vertBuffer, indices));

		if (this.data.rampType !== RampType.Wire1) {
			meshes.push(new Mesh(vertBuffer2, indices));
		}

		return meshes;
	}

	private createWire(numRings: number, numSegments: number, midPoints: Vertex2D[], rgheightInit: number[]): Vertex3DNoTex2[] {
		const rgvbuf: Vertex3DNoTex2[] = [];
		let prevB: Vertex3D = new Vertex3D();
		let index = 0;
		for (let i = 0; i < numRings; i++) {

			const i2 = (i === (numRings - 1)) ? i : i + 1;
			const height = rgheightInit[i];

			const tangent = new Vertex3D(midPoints[i2].x - midPoints[i].x, midPoints[i2].y - midPoints[i].y, rgheightInit[i2] - rgheightInit[i]);
			if (i === numRings - 1) {
				// for the last spline point use the previous tangent again, otherwise we won't see the complete wire (it stops one control point too early)
				tangent.x = midPoints[i].x - midPoints[i - 1].x;
				tangent.y = midPoints[i].y - midPoints[i - 1].y;
			}
			let binorm: Vertex3D;
			let normal: Vertex3D;
			if (i === 0) {
				const up = new Vertex3D(midPoints[i2].x + midPoints[i].x, midPoints[i2].y + midPoints[i].y, rgheightInit[i2] - height);
				normal = tangent.clone().cross(up);     //normal
				binorm = tangent.clone().cross(normal);
			} else {
				normal = prevB.clone().cross(tangent);
				binorm = tangent.clone().cross(normal);
			}
			binorm.normalize();
			normal.normalize();
			prevB = binorm;

			const invNumRings = f4(1.0 / f4(numRings));
			const invNumSegments = f4(1.0 / f4(numSegments));
			const u = f4(i * invNumRings);
			for (let j = 0; j < numSegments; j++, index++) {
				const v = f4(f4(j + u) * invNumSegments);
				const tmp: Vertex3D = Vertex3D.getRotatedAxis(f4(j * f4(360.0 * invNumSegments)), tangent, normal).multiplyScalar(this.data.wireDiameter * f4(0.5));
				rgvbuf[index] = new Vertex3DNoTex2();
				rgvbuf[index].x = midPoints[i].x + tmp.x;
				rgvbuf[index].y = midPoints[i].y + tmp.y;
				rgvbuf[index].z = height + tmp.z;
				//texel
				rgvbuf[index].tu = u;
				rgvbuf[index].tv = v;
				const n = new Vertex3D(rgvbuf[index].x - midPoints[i].x, rgvbuf[index].y - midPoints[i].y, rgvbuf[index].z - height);
				const len = f4(1.0 / f4(Math.sqrt(f4(f4(f4(n.x * n.x) + f4(n.y * n.y)) + f4(n.z * n.z)))));
				rgvbuf[index].nx = n.x * len;
				rgvbuf[index].ny = n.y * len;
				rgvbuf[index].nz = n.z * len;
			}
		}
		return rgvbuf;
	}

	public getRampVertex(table: Table, accuracy: number, incWidth: boolean): RampVertexResult {

		const ppheight: number[] = [];
		const ppfCross: boolean[] = [];
		const ppratio: number[] = [];
		const pMiddlePoints: Vertex2D[] = [];

		// vvertex are the 2D vertices forming the central curve of the ramp as seen from above
		const vvertex = this.getCentralCurve(table, accuracy);

		const cvertex = vvertex.length;
		const pcvertex = cvertex;
		const rgvLocal: Vertex2D[] = [];

		// Compute an approximation to the length of the central curve
		// by adding up the lengths of the line segments.
		let totalLength = 0;
		const bottomHeight = f4(this.data.heightBottom + table.getTableHeight());
		const topHeight = f4(this.data.heightTop + table.getTableHeight());

		for (let i = 0; i < (cvertex - 1); i++) {

			const v1 = vvertex[i];
			const v2 = vvertex[i + 1];

			const dx = f4(v1.x - v2.x);
			const dy = f4(v1.y - v2.y);
			const length = f4(Math.sqrt(f4(dx * dx) + f4(dy * dy)));

			totalLength = f4(totalLength + length);
		}

		let currentLength = 0;
		for (let i = 0; i < cvertex; i++) {

			// clamp next and prev as ramps do not loop
			const vprev = vvertex[(i > 0) ? i - 1 : i];
			const vnext = vvertex[(i < (cvertex - 1)) ? i + 1 : i];
			const vmiddle = vvertex[i];

			ppfCross[i] = vmiddle.fControlPoint;

			let vnormal = new Vertex2D();
			// Get normal at this point
			// Notice that these values equal the ones in the line
			// equation and could probably be substituted by them.
			const v1normal = new Vertex2D(vprev.y - vmiddle.y, vmiddle.x - vprev.x);   // vector vmiddle-vprev rotated RIGHT
			const v2normal = new Vertex2D(vmiddle.y - vnext.y, vnext.x - vmiddle.x);   // vector vnext-vmiddle rotated RIGHT

			// special handling for beginning and end of the ramp, as ramps do not loop
			if (i === (cvertex - 1)) {
				v1normal.normalize();
				vnormal = v1normal;

			} else if (i === 0) {
				v2normal.normalize();
				vnormal = v2normal;

			} else {
				v1normal.normalize();
				v2normal.normalize();

				if (Math.abs(f4(v1normal.x - v2normal.x)) < 0.0001 && Math.abs(f4(v1normal.y - v2normal.y)) < 0.0001) {
					// Two parallel segments
					vnormal = v1normal;

				} else {
					// Find intersection of the two edges meeting this points, but
					// shift those lines outwards along their normals

					// First line
					const A = f4(vprev.y - vmiddle.y);
					const B = f4(vmiddle.x - vprev.x);

					// Shift line along the normal
					const C = -f4(f4(A * f4(vprev.x - v1normal.x)) + f4(B * f4(vprev.y - v1normal.y)));

					// Second line
					const D = f4(vnext.y - vmiddle.y);
					const E = f4(vmiddle.x - vnext.x);

					// Shift line along the normal
					const F = -f4(f4(D * f4(vnext.x - v2normal.x)) + f4(E * f4(vnext.y - v2normal.y)));

					const det = f4(f4(A * E) - f4(B * D));
					const invDet = (det !== 0.0) ? f4(1.0 / det) : 0.0;

					const intersectX = f4(f4(f4(B * F) - f4(E * C)) * invDet);
					const intersectY = f4(f4(f4(C * D) - f4(A * F)) * invDet);

					vnormal.x = vmiddle.x - intersectX;
					vnormal.y = vmiddle.y - intersectY;
				}
			}

			// Update current length along the ramp.
			const dx = f4(vprev.x - vmiddle.x);
			const dy = f4(vprev.y - vmiddle.y);
			const length = f4(Math.sqrt(f4(dx * dx) + f4(dy * dy)));

			currentLength = f4(currentLength + length);

			const percentage = f4(currentLength / totalLength);
			let currentWidth = f4(f4(percentage * f4(this.data.widthTop - this.data.widthBottom)) + this.data.widthBottom);
			ppheight[i] = f4(f4(vmiddle.z + f4(percentage * f4(topHeight - bottomHeight))) + bottomHeight);

			this.assignHeightToControlPoint(vvertex[i], f4(f4(vmiddle.z + f4(percentage * f4(topHeight - bottomHeight))) + bottomHeight));
			ppratio[i] = f4(1.0 - percentage);

			// only change the width if we want to create vertices for rendering or for the editor
			// the collision engine uses flat type ramps
			if (this.isHabitrail() && this.data.rampType !== RampType.Wire1) {
				currentWidth = this.data.wireDistanceX;
				if (incWidth) {
					currentWidth = f4(currentWidth + 20.0);
				}
			} else if (this.data.rampType === RampType.Wire1) {
				currentWidth = this.data.wireDiameter;
			}

			pMiddlePoints[i] = new Vertex2D(vmiddle.x, vmiddle.y).add(vnormal);
			rgvLocal[i] = new Vertex2D(vmiddle.x, vmiddle.y).add(vnormal.clone().multiplyScalar(currentWidth * f4(0.5)));
			rgvLocal[cvertex * 2 - i - 1] = new Vertex2D(vmiddle.x, vmiddle.y).sub(vnormal.clone().multiplyScalar(currentWidth * f4(0.5)));
		}

		return { rgvLocal, pcvertex, ppheight, ppfCross, ppratio, pMiddlePoints };
	}

	public getCentralCurve(table: Table, acc: number = -1.0): RenderVertex3D[] {
		let accuracy: number;

		// as solid ramps are rendered into the static buffer, always use maximum precision
		if (acc !== -1.0) {
			accuracy = acc; // used for hit shape calculation, always!
		} else {
			const mat = table.getMaterial(this.data.szMaterial);
			if (!mat || !mat.isOpacityActive) {
				accuracy = 10.0;
			} else {
				accuracy = table.getDetailLevel();
			}
		}
		accuracy = f4(f4(4.0) * f4(Math.pow(10.0, f4(f4(10.0 - accuracy) * f4(f4(1.0) / f4(1.5)))))); // min = 4 (highest accuracy/detail level), max = 4 * 10^(10/1.5) = ~18.000.000 (lowest accuracy/detail level)
		return DragPoint.getRgVertex<RenderVertex3D>(this.data.dragPoints, () => new RenderVertex3D(), CatmullCurve3D.fromVertex3D as any, false, accuracy);
	}

	private isHabitrail(): boolean {
		return this.data.rampType === RampType.Wire4
			|| this.data.rampType === RampType.Wire1
			|| this.data.rampType === RampType.Wire2
			|| this.data.rampType === RampType.Wire3Left
			|| this.data.rampType === RampType.Wire3Right;
	}

	private assignHeightToControlPoint(v: RenderVertex3D, height: number) {
		for (const dragPoint of this.data.dragPoints) {
			if (dragPoint.vertex.x === v.x && dragPoint.vertex.y === v.y) {
				dragPoint.calcHeight = height;
			}
		}
	}
}

export interface RampMeshes {
	wire1?: Mesh;
	wire2?: Mesh;
	wire3?: Mesh;
	wire4?: Mesh;
	floor?: Mesh;
	left?: Mesh;
	right?: Mesh;
}

interface RampVertexResult {
	pcvertex: number;
	ppheight: number[];
	ppfCross: boolean[];
	ppratio: number[];
	pMiddlePoints: Vertex2D[];
	rgvLocal: Vertex2D[];
}
