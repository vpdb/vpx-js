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

import { Storage } from '..';
import { BiffParser } from '../io/biff-parser';
import { CatmullCurve3D } from '../math/catmull-curve';
import { DragPoint } from '../math/dragpoint';
import { f4 } from '../math/float';
import { Matrix3D } from '../math/matrix3d';
import { Vertex3DNoTex2 } from '../math/vertex';
import { Vertex2D } from '../math/vertex2d';
import { RenderVertex3D, Vertex3D } from '../math/vertex3d';
import { IRenderable, ItemData, Meshes, RenderInfo } from './item-data';
import { Mesh } from './mesh';
import { Table } from './table';

/**
 * VPinball's ramps.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/ramp.cpp
 */
export class RampItem extends ItemData implements IRenderable {

	public static RampTypeFlat = 0;
	public static RampType4Wire = 1;
	public static RampType2Wire = 2;
	public static RampType3WireLeft = 3;
	public static RampType3WireRight = 4;
	public static RampType1Wire = 5;

	public static RampImageAlignmentWorld = 0;
	public static RampImageAlignmentWrap = 1;

	public wzName!: string;
	public dragPoints: DragPoint[] = [];
	public heightBottom: number = 0;
	public heightTop: number = f4(50);
	public widthBottom: number = f4(75);
	public widthTop: number = f4(60);
	public szMaterial?: string;
	public isTimerEnabled?: number;
	public timerInterval?: number;
	public rampType: number = RampItem.RampTypeFlat;
	public szImage?: string;
	public imageAlignment: number = RampItem.RampImageAlignmentWorld;
	public imageWalls: boolean = true;
	public leftWallHeight: number = f4(62);
	public rightWallHeight: number = f4(62);
	public leftWallHeightVisible: number = f4(30);
	public rightWallHeightVisible: number = f4(30);
	public hasHitEvent: boolean = false;
	public threshold?: number;
	public elasticity?: number;
	public friction?: number;
	public scatter?: number;
	public isCollidable: boolean = true;
	public fVisible: boolean = true;
	public fReflectionEnabled: boolean = true;
	public depthBias?: number;
	public wireDiameter: number = f4(8);
	public wireDistanceX: number = f4(38);
	public wireDistanceY: number = f4(88);
	public szPhysicsMaterial?: string;
	public fOverwritePhysics: boolean = false;

	public static async fromStorage(storage: Storage, itemName: string): Promise<RampItem> {
		const rampItem = new RampItem(itemName);
		await storage.streamFiltered(itemName, 4, RampItem.createStreamHandler(rampItem));
		if (rampItem.widthTop === 0 && rampItem.widthBottom > 0) {
			rampItem.widthTop = 0.1;
		}
		if (rampItem.widthBottom === 0 && rampItem.widthTop > 0) {
			rampItem.widthBottom = 0.1;
		}
		return rampItem;
	}

	private static createStreamHandler(rampItem: RampItem) {
		rampItem.dragPoints = [];
		return BiffParser.stream(rampItem.fromTag.bind(rampItem), {
			nestedTags: {
				DPNT: {
					onStart: () => new DragPoint(),
					onTag: dragPoint => dragPoint.fromTag.bind(dragPoint),
					onEnd: dragPoint => rampItem.dragPoints.push(dragPoint),
				},
			},
		});
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	public isVisible(): boolean {
		return this.fVisible && this.widthTop > 0 && this.widthBottom > 0;
	}

	public getMeshes(table: Table): Meshes {
		const meshes: Meshes = {};
		if (!this.isHabitrail()) {
			return this.generateFlatMesh(table);

		} else {
			const [wireMeshA, wireMeshB] = this.generateWireMeshes(table);
			switch (this.rampType) {
				case RampItem.RampType1Wire: {
					wireMeshA.name = `ramp.wire1-${this.getName()}`;
					meshes.wire1 = {
						mesh: wireMeshA.transform(new Matrix3D().toRightHanded()),
						map: table.getTexture(this.szImage),
						material: table.getMaterial(this.szMaterial),
					};
					break;
				}
				case RampItem.RampType2Wire: {
					const wire1Mesh = wireMeshA.makeTranslation(0, 0, 3.0);
					const wire2Mesh = wireMeshB.makeTranslation(0, 0, 3.0);
					wire1Mesh.name = `ramp.wire1-${this.getName()}`;
					wire2Mesh.name = `ramp.wire2-${this.getName()}`;
					meshes.wire1 = {
						mesh: wire1Mesh.transform(new Matrix3D().toRightHanded()),
						material: table.getMaterial(this.szMaterial),
					};
					meshes.wire2 = {
						mesh: wire2Mesh.transform(new Matrix3D().toRightHanded()),
						material: table.getMaterial(this.szMaterial),
					};
					break;
				}
				case RampItem.RampType4Wire: {
					const wire1Mesh = wireMeshA.clone(`ramp.wire1-${this.getName()}`).makeTranslation(0, 0, this.wireDistanceY * 0.5);
					const wire2Mesh = wireMeshB.clone(`ramp.wire2-${this.getName()}`).makeTranslation(0, 0, this.wireDistanceY * 0.5);
					const wire3Mesh = wireMeshA.makeTranslation(0, 0, 3.0);
					const wire4Mesh = wireMeshB.makeTranslation(0, 0, 3.0);
					wire3Mesh.name = `ramp.wire3-${this.getName()}`;
					wire4Mesh.name = `ramp.wire4-${this.getName()}`;
					meshes.wire1 = {
						mesh: wire1Mesh.transform(new Matrix3D().toRightHanded()),
						material: table.getMaterial(this.szMaterial),
					};
					meshes.wire2 = {
						mesh: wire2Mesh.transform(new Matrix3D().toRightHanded()),
						material: table.getMaterial(this.szMaterial),
					};
					meshes.wire3 = {
						mesh: wire3Mesh.transform(new Matrix3D().toRightHanded()),
						material: table.getMaterial(this.szMaterial),
					};
					meshes.wire4 = {
						mesh: wire4Mesh.transform(new Matrix3D().toRightHanded()),
						material: table.getMaterial(this.szMaterial),
					};
					break;
				}
				case RampItem.RampType3WireLeft: {
					const wire2Mesh = wireMeshB.clone(`ramp.wire2-${this.getName()}`).makeTranslation(0, 0, this.wireDistanceY * 0.5);
					const wire3Mesh = wireMeshA.makeTranslation(0, 0, 3.0);
					const wire4Mesh = wireMeshB.makeTranslation(0, 0, 3.0);
					wire3Mesh.name = `ramp.wire3-${this.getName()}`;
					wire4Mesh.name = `ramp.wire4-${this.getName()}`;
					meshes.wire2 = {
						mesh: wire2Mesh.transform(new Matrix3D().toRightHanded()),
						material: table.getMaterial(this.szMaterial),
					};
					meshes.wire3 = {
						mesh: wire3Mesh.transform(new Matrix3D().toRightHanded()),
						material: table.getMaterial(this.szMaterial),
					};
					meshes.wire4 = {
						mesh: wire4Mesh.transform(new Matrix3D().toRightHanded()),
						material: table.getMaterial(this.szMaterial),
					};
					break;
				}
				case RampItem.RampType3WireRight: {
					const wire1Mesh = wireMeshA.clone(`ramp.wire1-${this.getName()}`).makeTranslation(0, 0, this.wireDistanceY * 0.5);
					const wire3Mesh = wireMeshA.makeTranslation(0, 0, 3.0);
					const wire4Mesh = wireMeshB.makeTranslation(0, 0, 3.0);
					wire3Mesh.name = `ramp.wire3-${this.getName()}`;
					wire4Mesh.name = `ramp.wire4-${this.getName()}`;
					meshes.wire1 = {
						mesh: wire1Mesh.transform(new Matrix3D().toRightHanded()),
						material: table.getMaterial(this.szMaterial),
					};
					meshes.wire3 = {
						mesh: wire3Mesh.transform(new Matrix3D().toRightHanded()),
						material: table.getMaterial(this.szMaterial),
					};
					meshes.wire4 = {
						mesh: wire4Mesh.transform(new Matrix3D().toRightHanded()),
						material: table.getMaterial(this.szMaterial),
					};
					break;
				}
			}
		}
		return meshes;
	}

	public getSurfaceHeight(x: number, y: number, table: Table) {
		const vVertex = this.getCentralCurve(table);

		let iSeg: number;
		let vOut: Vertex2D;
		[vOut, iSeg] = Mesh.closestPointOnPolygon(vVertex, new Vertex2D(x, y), false);

		if (iSeg === -1) {
			return 0.0; // Object is not on ramp path
		}

		// Go through vertices (including iSeg itself) counting control points until iSeg
		let totalLength = 0.0;
		let startLength = 0.0;

		const cVertex = vVertex.length;
		for (let i2 = 1; i2 < cVertex; i2++) {
			const vDx = f4(vVertex[i2].x - vVertex[i2 - 1].x);
			const vDy = f4(vVertex[i2].y - vVertex[i2 - 1].y);
			const vLen = f4(Math.sqrt(f4(f4(vDx * vDx) + f4(vDy * vDy))));
			if (i2 <= iSeg) {
				startLength = f4(startLength + vLen);
			}
			totalLength = f4(totalLength + vLen);
		}

		const dx = f4(vOut.x - vVertex[iSeg].x);
		const dy = f4(vOut.y - vVertex[iSeg].y);
		const len = f4(Math.sqrt(f4(f4(dx * dx) + f4(dy * dy))));
		startLength = f4(startLength + len); // Add the distance the object is between the two closest polyline segments.  Matters mostly for straight edges. Z does not respect that yet!

		const topHeight = f4(this.heightTop + table.getTableHeight());
		const bottomHeight = f4(this.heightBottom + table.getTableHeight());

		return f4(f4(vVertex[iSeg].z + f4(f4(startLength / totalLength) * f4(topHeight - bottomHeight))) + bottomHeight);
	}

	private generateFlatMesh(table: Table): Meshes {
		const rv = this.getRampVertex(table, -1, true);
		const meshes: Meshes = {
			floor: this.generateFlatFloorMesh(table, rv),
		};
		if (this.leftWallHeightVisible > 0.0) {
			meshes.left = this.generateFlatLeftWall(table, rv);
		}
		if (this.rightWallHeightVisible > 0.0) {
			meshes.right = this.generateFlatRightWall(table, rv);
		}
		return meshes;
	}

	private generateFlatFloorMesh(table: Table, rv: RampVertexResult): RenderInfo {
		const rampVertex = rv.pcvertex;
		const rgHeight = rv.ppheight;
		const rgRatio = rv.ppratio;
		const dim = table.getDimensions();
		const invTableWidth = f4(1.0 / f4(dim.width));
		const invTableHeight = f4(1.0 / f4(dim.height));
		const numVertices = rv.pcvertex * 2;

		const mesh = new Mesh(`ramp.floor-${this.getName()}`);
		for (let i = 0; i < rampVertex; i++) {

			const rgv3d1 = new Vertex3DNoTex2();
			const rgv3d2 = new Vertex3DNoTex2();

			rgv3d1.x = rv.rgvLocal[i].x;
			rgv3d1.y = rv.rgvLocal[i].y;
			rgv3d1.z = rgHeight[i] * table.getScaleZ();

			rgv3d2.x = rv.rgvLocal[rampVertex * 2 - i - 1].x;
			rgv3d2.y = rv.rgvLocal[rampVertex * 2 - i - 1].y;
			rgv3d2.z = rgv3d1.z;

			if (this.szImage) {
				if (this.imageAlignment === RampItem.RampImageAlignmentWorld) {
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
		return {
			mesh: mesh.transform(new Matrix3D().toRightHanded()),
			map: table.getTexture(this.szImage),
			material: table.getMaterial(this.szMaterial),
		};
	}

	private generateFlatLeftWall(table: Table, rv: RampVertexResult): RenderInfo {
		const rampVertex = rv.pcvertex;
		const rgHeight = rv.ppheight;
		const rgRatio = rv.ppratio;
		const dim = table.getDimensions();
		const invTableWidth = f4(1.0 / f4(dim.width));
		const invTableHeight = f4(1.0 / f4(dim.height));
		const numVertices = rampVertex * 2;

		const mesh = new Mesh(`ramp.left-${this.getName()}`);
		for (let i = 0; i < rampVertex; i++) {

			const rgv3d1 = new Vertex3DNoTex2();
			const rgv3d2 = new Vertex3DNoTex2();

			rgv3d1.x = rv.rgvLocal[rampVertex * 2 - i - 1].x;
			rgv3d1.y = rv.rgvLocal[rampVertex * 2 - i - 1].y;
			rgv3d1.z = rgHeight[i] * table.getScaleZ();

			rgv3d2.x = rgv3d1.x;
			rgv3d2.y = rgv3d1.y;
			rgv3d2.z = f4(rgHeight[i] + this.leftWallHeightVisible) * table.getScaleZ();

			if (this.szImage && this.imageWalls) {
				if (this.imageAlignment === RampItem.RampImageAlignmentWorld) {
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
		return {
			mesh: mesh.transform(new Matrix3D().toRightHanded()),
			map: table.getTexture(this.szImage),
			material: table.getMaterial(this.szMaterial),
		};
	}

	private generateFlatRightWall(table: Table, rv: RampVertexResult): RenderInfo {
		const rampVertex = rv.pcvertex;
		const rgHeight = rv.ppheight;
		const rgRatio = rv.ppratio;
		const dim = table.getDimensions();
		const invTableWidth = f4(1.0 / f4(dim.width));
		const invTableHeight = f4(1.0 / f4(dim.height));
		const numVertices = rampVertex * 2;

		const mesh = new Mesh(`ramp.right-${this.getName()}`);
		for (let i = 0; i < rampVertex; i++) {

			const rgv3d1 = new Vertex3DNoTex2();
			const rgv3d2 = new Vertex3DNoTex2();

			rgv3d1.x = rv.rgvLocal[i].x;
			rgv3d1.y = rv.rgvLocal[i].y;
			rgv3d1.z = rgHeight[i] * table.getScaleZ();

			rgv3d2.x = rv.rgvLocal[i].x;
			rgv3d2.y = rv.rgvLocal[i].y;
			rgv3d2.z = f4(rgHeight[i] + this.rightWallHeightVisible) * table.getScaleZ();

			if (this.szImage && this.imageWalls) {
				if (this.imageAlignment === RampItem.RampImageAlignmentWorld) {
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
		return {
			mesh: mesh.transform(new Matrix3D().toRightHanded()),
			map: table.getTexture(this.szImage),
			material: table.getMaterial(this.szMaterial),
		};
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
		const mat = table.getMaterial(this.szMaterial);
		if (!mat || !mat.bOpacityActive) {
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

		if (this.rampType !== RampItem.RampType1Wire) {
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

		if (this.rampType !== RampItem.RampType1Wire) {
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
				const tmp: Vertex3D = Vertex3D.getRotatedAxis(f4(j * f4(360.0 * invNumSegments)), tangent, normal).multiplyScalar(this.wireDiameter * f4(0.5));
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

	private getRampVertex(table: Table, accuracy: number, incWidth: boolean): RampVertexResult {

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
		const bottomHeight = f4(this.heightBottom + table.getTableHeight());
		const topHeight = f4(this.heightTop + table.getTableHeight());

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
			let currentWidth = f4(f4(percentage * f4(this.widthTop - this.widthBottom)) + this.widthBottom);
			ppheight[i] = f4(f4(vmiddle.z + f4(percentage * f4(topHeight - bottomHeight))) + bottomHeight);

			this.assignHeightToControlPoint(vvertex[i], f4(f4(vmiddle.z + f4(percentage * f4(topHeight - bottomHeight))) + bottomHeight));
			ppratio[i] = f4(1.0 - percentage);

			// only change the width if we want to create vertices for rendering or for the editor
			// the collision engine uses flat type ramps
			if (this.isHabitrail() && this.rampType !== RampItem.RampType1Wire) {
				currentWidth = this.wireDistanceX;
				if (incWidth) {
					currentWidth = f4(currentWidth + 20.0);
				}
			} else if (this.rampType === RampItem.RampType1Wire) {
				currentWidth = this.wireDiameter;
			}

			pMiddlePoints[i] = new Vertex2D(vmiddle.x, vmiddle.y).add(vnormal);
			rgvLocal[i] = new Vertex2D(vmiddle.x, vmiddle.y).add(vnormal.clone().multiplyScalar(currentWidth * f4(0.5)));
			rgvLocal[cvertex * 2 - i - 1] = new Vertex2D(vmiddle.x, vmiddle.y).sub(vnormal.clone().multiplyScalar(currentWidth * f4(0.5)));
		}

		return { rgvLocal, pcvertex, ppheight, ppfCross, ppratio, pMiddlePoints };
	}

	private getCentralCurve(table: Table, acc: number = -1.0): RenderVertex3D[] {
		let accuracy: number;

		// as solid ramps are rendered into the static buffer, always use maximum precision
		if (acc !== -1.0) {
			accuracy = acc; // used for hit shape calculation, always!
		} else {
			const mat = table.getMaterial(this.szMaterial);
			if (!mat || !mat.bOpacityActive) {
				accuracy = 10.0;
			} else {
				accuracy = table.getDetailLevel();
			}
		}
		accuracy = f4(f4(4.0) * f4(Math.pow(10.0, f4(f4(10.0 - accuracy) * f4(f4(1.0) / f4(1.5)))))); // min = 4 (highest accuracy/detail level), max = 4 * 10^(10/1.5) = ~18.000.000 (lowest accuracy/detail level)
		return DragPoint.getRgVertex<RenderVertex3D>(this.dragPoints, () => new RenderVertex3D(), CatmullCurve3D.fromVertex3D as any, false, accuracy);
	}

	private isHabitrail(): boolean {
		return this.rampType === RampItem.RampType4Wire
			|| this.rampType === RampItem.RampType1Wire
			|| this.rampType === RampItem.RampType2Wire
			|| this.rampType === RampItem.RampType3WireLeft
			|| this.rampType === RampItem.RampType3WireRight;
	}

	private assignHeightToControlPoint(v: RenderVertex3D, height: number) {
		for (const dragPoint of this.dragPoints) {
			if (dragPoint.vertex.x === v.x && dragPoint.vertex.y === v.y) {
				dragPoint.calcHeight = height;
			}
		}
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'HTBT': this.heightBottom = this.getFloat(buffer); break;
			case 'HTTP': this.heightTop = this.getFloat(buffer); break;
			case 'WDBT': this.widthBottom = this.getFloat(buffer); break;
			case 'WDTP': this.widthTop = this.getFloat(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'TYPE': this.rampType = this.getInt(buffer); break;
			case 'IMAG': this.szImage = this.getString(buffer, len); break;
			case 'ALGN': this.imageAlignment = this.getInt(buffer); break;
			case 'IMGW': this.imageWalls = this.getBool(buffer); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'WLHL': this.leftWallHeight = this.getFloat(buffer); break;
			case 'WLHR': this.rightWallHeight = this.getFloat(buffer); break;
			case 'WVHL': this.leftWallHeightVisible = this.getFloat(buffer); break;
			case 'WVHR': this.rightWallHeightVisible = this.getFloat(buffer); break;
			case 'HTEV': this.hasHitEvent = this.getBool(buffer); break;
			case 'THRS': this.threshold = this.getFloat(buffer); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'RFCT': this.friction = this.getFloat(buffer); break;
			case 'RSCT': this.scatter = this.getFloat(buffer); break;
			case 'CLDR': this.isCollidable = this.getBool(buffer); break;
			case 'RVIS': this.fVisible = this.getBool(buffer); break;
			case 'REEN': this.fReflectionEnabled = this.getBool(buffer); break;
			case 'RADB': this.depthBias = this.getFloat(buffer); break;
			case 'RADI': this.wireDiameter = this.getFloat(buffer); break;
			case 'RADX': this.wireDistanceX = this.getFloat(buffer); break;
			case 'RADY': this.wireDistanceY = this.getFloat(buffer); break;
			case 'MAPH': this.szPhysicsMaterial = this.getString(buffer, len); break;
			case 'OVPH': this.fOverwritePhysics = this.getBool(buffer); break;
			case 'PNTS': break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}

interface RampVertexResult {
	pcvertex: number;
	ppheight: number[];
	ppfCross: boolean[];
	ppratio: number[];
	pMiddlePoints: Vertex2D[];
	rgvLocal: Vertex2D[];
}
