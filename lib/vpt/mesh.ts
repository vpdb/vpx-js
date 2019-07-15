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

import { BufferGeometry, Object3D } from 'three';
import { MeshConverter } from '../gltf/mesh-converter';
import { f4, fr } from '../math/float';
import { Matrix3D } from '../math/matrix3d';
import { Vertex3DNoTex2 } from '../math/vertex';
import { RenderVertex, Vertex2D } from '../math/vertex2d';
import { RenderVertex3D, Vertex3D } from '../math/vertex3d';
import { FrameData } from './animation';

export const FLT_MIN = 1.175494350822287507968736537222245677819e-038;
export const FLT_MAX = 340282346638528859811704183484516925440;

/**
 * VPinball's mesh.
 *
 * This is transcribed code from C++ of the features we need for mesh
 * generation.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/mesh.h
 */
export class Mesh {

	private static exportPrecision = 6;

	public name!: string;
	public vertices: Vertex3DNoTex2[] = [];
	public animationFrames: FrameData[] = [];
	public indices: number[] = [];
	public faceIndexOffset = 0;

	constructor(vertices: Vertex3DNoTex2[]|string = [], indices: number[] = []) {
		if (typeof vertices === 'string') {
			this.name = vertices;
		} else {
			this.vertices = vertices;
		}
		this.indices = indices;
	}

	public static fromArray(vertices: number[][], indices: number[]): Mesh {
		const mesh = new Mesh();
		for (const vertex of vertices) {
			mesh.vertices.push(Vertex3DNoTex2.fromArray(vertex));
		}
		mesh.indices = indices;
		return mesh;
	}

	/* istanbul ignore next: Only used for debugging */
	public serializeToObj(description?: string): string {

		const objFile: string[] = [];
		//const mtlFile: string[] = [];

		//this._writeHeader(objFile, mtlFile, basename(fileName) + '.wt');
		this._writeObjectName(objFile, description || this.name || '<name not set>');
		this._writeVertexInfo(objFile);
		this._writeFaceInfoLong(objFile);

		return objFile.join('\n');
	}

	public getBufferGeometry(): BufferGeometry {
		const converter = new MeshConverter(this);
		return converter.convertToBufferGeometry();
	}

	public transform(matrix: Matrix3D, normalMatrix?: Matrix3D, getZ?: (x: number) => number): this {
		for (const vertex of this.vertices) {
			let vert = new Vertex3D(vertex.x, vertex.y, vertex.z);
			vert = matrix.multiplyVector(vert);
			vertex.x = vert.x;
			vertex.y = vert.y;
			vertex.z = getZ ? getZ(vert.z) : vert.z;

			let norm = new Vertex3D(vertex.nx, vertex.ny, vertex.nz);
			norm = (normalMatrix || matrix).multiplyVectorNoTranslate(norm);
			vertex.nx = norm.x;
			vertex.ny = norm.y;
			vertex.nz = norm.z;
		}
		return this;
	}

	public makeTranslation(x: number, y: number, z: number) {
		for (const vertex of this.vertices) {
			vertex.x += f4(x);
			vertex.y += f4(y);
			vertex.z += f4(z);
		}
		return this;
	}

	public applyToObject(obj: Object3D) {
		const destGeo = (obj as any).geometry;
		const srcGeo = this.getBufferGeometry();
		if (srcGeo.attributes.position.array.length !== destGeo.attributes.position.array.length) {
			throw new Error(`Trying to apply geometry of ${srcGeo.attributes.position.array.length} positions to ${destGeo.attributes.position.array.length} positions.`);
		}
		for (let i = 0; i < destGeo.attributes.position.array.length; i++) {
			destGeo.attributes.position.array[i] = srcGeo.attributes.position.array[i];
		}
		destGeo.attributes.position.needsUpdate = true;
	}

	public clone(name?: string): Mesh {
		const mesh = new Mesh();
		mesh.name = name || this.name;
		mesh.vertices = this.vertices.map(v => v.clone());
		mesh.animationFrames = this.animationFrames.map(a => a.clone());
		mesh.indices = this.indices.slice();
		mesh.faceIndexOffset = this.faceIndexOffset;
		return mesh;
	}

	public static computeNormals(vertices: Vertex3DNoTex2[], numVertices: number, indices: number[], numIndices: number) {

		for (let i = 0; i < numVertices; i++) {
			const v = vertices[i];
			v.nx = v.ny = v.nz = 0.0;
		}

		for (let i = 0; i < numIndices; i += 3) {
			const A = vertices[indices[i]];
			const B = vertices[indices[i + 1]];
			const C = vertices[indices[i + 2]];

			const e0 = new Vertex3D(B.x - A.x, B.y - A.y, B.z - A.z);
			const e1 = new Vertex3D(C.x - A.x, C.y - A.y, C.z - A.z);
			const normal = e0.clone().cross(e1);
			normal.normalize();

			A.nx += normal.x; A.ny += normal.y; A.nz += normal.z;
			B.nx += normal.x; B.ny += normal.y; B.nz += normal.z;
			C.nx += normal.x; C.ny += normal.y; C.nz += normal.z;
		}

		for (let i = 0; i < numVertices; i++) {
			const v = vertices[i];
			const l = f4(f4(f4(v.nx * v.nx) + f4(v.ny * v.ny)) + f4(v.nz * v.nz));
			const invL = (l >= FLT_MIN) ? f4(1.0 / f4(Math.sqrt(l))) : 0.0;
			v.nx *= invL;
			v.ny *= invL;
			v.nz *= invL;
		}
	}

	/* istanbul ignore next */
	public static setNormal(rgv: Vertex3DNoTex2[], rgi: number[], count: number, applyCount = 0): void {

		const rgvApply = rgv;
		const rgiApply = rgi;
		if (applyCount === 0) {
			applyCount = count;
		}

		const vnormal = new Vertex3D(0.0, 0.0, 0.0);

		for (let i = 0; i < count; ++i) {
			const l = rgi[i];
			const m = rgi[(i < count - 1) ? (i + 1) : 0];

			vnormal.x += f4(rgv[l].y - rgv[m].y) * f4(rgv[l].z + rgv[m].z);
			vnormal.y += f4(rgv[l].z - rgv[m].z) * f4(rgv[l].x + rgv[m].x);
			vnormal.z += f4(rgv[l].x - rgv[m].x) * f4(rgv[l].y + rgv[m].y);
		}

		vnormal.normalize();

		for (let i = 0; i < applyCount; ++i) {
			const l = rgiApply[i];
			rgvApply[l].nx = vnormal.x;
			rgvApply[l].ny = vnormal.y;
			rgvApply[l].nz = vnormal.z;
		}
	}

	public static closestPointOnPolygon(rgv: RenderVertex3D[], pvin: Vertex2D, fClosed: boolean): [Vertex2D, number] {

		const count = rgv.length;
		let mindist = FLT_MAX;
		let piSeg = -1; // in case we are not next to the line
		const pvOut = new Vertex2D();
		let cloop = count;
		if (!fClosed) {
			--cloop; // Don't check segment running from the end point to the beginning point
		}

		// Go through line segment, calculate distance from point to the line
		// then pick the shortest distance
		for (let i = 0; i < cloop; ++i) {
			const p2 = (i < count - 1) ? (i + 1) : 0;

			const rgvi = new RenderVertex3D();
			rgvi.set(rgv[i].x, rgv[i].y, rgv[i].z);
			const rgvp2 = new RenderVertex3D();
			rgvp2.set(rgv[p2].x, rgv[p2].y, rgv[p2].z);
			const A = f4(rgvi.y - rgvp2.y);
			const B = f4(rgvp2.x - rgvi.x);
			const C = -f4(f4(A * rgvi.x) + f4(B * rgvi.y));

			const dist = f4(f4(Math.abs(f4(f4(f4(A * pvin.x) + f4(B * pvin.y)) + C))) / f4(Math.sqrt(f4(f4(A * A) + f4(B * B)))));

			if (dist < mindist) {
				// Assuming we got a segment that we are closet to, calculate the intersection
				// of the line with the perpenticular line projected from the point,
				// to find the closest point on the line
				const D = -B;
				const F = -f4(f4(D * pvin.x) + f4(A * pvin.y));

				const det = f4(f4(A * A) - f4(B * D));
				const invDet = (det !== 0.0) ? f4(1.0 / det) : 0.0;
				const intersectX = f4(f4(f4(B * F) - f4(A * C)) * invDet);
				const intersectY = f4(f4(f4(C * D) - f4(A * F)) * invDet);

				// If the intersect point lies on the polygon segment
				// (not out in space), then make this the closest known point
				if (intersectX >= f4(Math.min(rgvi.x, rgvp2.x) - f4(0.1)) &&
					intersectX <= f4(Math.max(rgvi.x, rgvp2.x) + f4(0.1)) &&
					intersectY >= f4(Math.min(rgvi.y, rgvp2.y) - f4(0.1)) &&
					intersectY <= f4(Math.max(rgvi.y, rgvp2.y) + f4(0.1))) {

					mindist = dist;
					const seg = i;

					pvOut.x = intersectX;
					pvOut.y = intersectY;
					piSeg = seg;
				}
			}
		}
		return [pvOut, piSeg];
	}

	public static polygonToTriangles(rgv: RenderVertex[], pvpoly: number[]): number[] {
		const pvtri: number[] = [];
		// There should be this many convex triangles.
		// If not, the polygon is self-intersecting
		const tricount = pvpoly.length - 2;

		for (let l = 0; l < tricount; ++l) {
			for (let i = 0; i < pvpoly.length; ++i) {
				const s = pvpoly.length;
				const pre = pvpoly[(i === 0) ? (s - 1) : (i - 1)];
				const a = pvpoly[i];
				const b = pvpoly[(i < s - 1) ? (i + 1) : 0];
				const c = pvpoly[(i < s - 2) ? (i + 2) : ((i + 2) - s)];
				const post = pvpoly[(i < s - 3) ? (i + 3) : ((i + 3) - s)];
				if (Mesh.advancePoint(rgv, pvpoly, a, b, c, pre, post)) {
					pvtri.push(a);
					pvtri.push(c);
					pvtri.push(b);
					pvpoly.splice((i < s - 1) ? (i + 1) : 0, 1); // b
					break;
				}
			}
		}
		return pvtri;
	}

	private static advancePoint(rgv: RenderVertex[], pvpoly: number[], a: number, b: number, c: number, pre: number, post: number): boolean {
		const pv1 = rgv[a];
		const pv2 = rgv[b];
		const pv3 = rgv[c];

		const pvPre = rgv[pre];
		const pvPost = rgv[post];

		if ((Mesh.getDot(pv1, pv2, pv3) < 0) ||
		// Make sure angle created by new triangle line falls inside existing angles
		// If the existing angle is a concave angle, then new angle must be smaller,
		// because our triangle can't have angles greater than 180
			((Mesh.getDot(pvPre, pv1, pv2) > 0) && (Mesh.getDot(pvPre, pv1, pv3) < 0)) || // convex angle, make sure new angle is smaller than it
			((Mesh.getDot(pv2, pv3, pvPost) > 0) && (Mesh.getDot(pv1, pv3, pvPost) < 0))) {

			return false;
		}

		// Now make sure the interior segment of this triangle (line ac) does not
		// intersect the polygon anywhere

		// sort our static line segment
		const minx = Math.min(pv1.x, pv3.x);
		const maxx = Math.max(pv1.x, pv3.x);
		const miny = Math.min(pv1.y, pv3.y);
		const maxy = Math.max(pv1.y, pv3.y);

		for (let i = 0; i < pvpoly.length; ++i) {

			const pvCross1 = rgv[pvpoly[i]];
			const pvCross2 = rgv[pvpoly[(i < pvpoly.length - 1) ? (i + 1) : 0]];

			if (pvCross1 !== pv1 && pvCross2 !== pv1 && pvCross1 !== pv3 && pvCross2 !== pv3 &&
				(pvCross1.y >= miny || pvCross2.y >= miny) &&
				(pvCross1.y <= maxy || pvCross2.y <= maxy) &&
				(pvCross1.x >= minx || pvCross2.x >= minx) &&
				(pvCross1.x <= maxx || pvCross2.y <= maxx) &&
				Mesh.fLinesIntersect(pv1, pv3, pvCross1, pvCross2)) {
				return false;
			}
		}

		return true;
	}

	private static getDot(pvEnd1: Vertex2D, pvJoint: Vertex2D, pvEnd2: Vertex2D): number {
		return (pvJoint.x - pvEnd1.x) * (pvJoint.y - pvEnd2.y)
			- (pvJoint.y - pvEnd1.y) * (pvJoint.x - pvEnd2.x);
	}

	private static fLinesIntersect(Start1: Vertex2D, Start2: Vertex2D, End1: Vertex2D, End2: Vertex2D): boolean {

		const x1 = Start1.x;
		const y1 = Start1.y;
		const x2 = Start2.x;
		const y2 = Start2.y;
		const x3 = End1.x;
		const y3 = End1.y;
		const x4 = End2.x;
		const y4 = End2.y;

		const d123 = f4(f4(f4(x2 - x1) * f4(y3 - y1)) - f4(f4(x3 - x1) * f4(y2 - y1)));

		if (d123 === 0.0) { // p3 lies on the same line as p1 and p2
			return (x3 >= Math.min(x1, x2) && x3 <= Math.max(x2, x1));
		}

		const d124 = f4(f4(f4(x2 - x1) * f4(y4 - y1)) - f4(f4(x4 - x1) * f4(y2 - y1)));

		if (d124 === 0.0) { // p4 lies on the same line as p1 and p2
			return (x4 >= Math.min(x1, x2) && x4 <= Math.max(x2, x1));
		}

		if (d123 * d124 >= 0.0) {
			return false;
		}

		const d341 = f4(f4(f4(x3 - x1) * f4(y4 - y1)) - f4(f4(x4 - x1) * f4(y3 - y1)));

		if (d341 === 0.0) { // p1 lies on the same line as p3 and p4
			return (x1 >= Math.min(x3, x4) && x1 <= Math.max(x3, x4));
		}

		const d342 = f4(f4(d123 - d124) + d341);

		if (d342 === 0.0) { // p1 lies on the same line as p3 and p4
			return (x2 >= Math.min(x3, x4) && x2 <= Math.max(x3, x4));
		}

		return (d341 * d342 < 0.0);
	}

	/* istanbul ignore next: Only used for debugging */
	private _writeObjectName(objFile: string[], objName: string): void {
		objFile.push(`o ${objName}`);
	}

	/* istanbul ignore next: Only used for debugging */
	private _writeVertexInfo(objFile: string[]): void {
		for (const vert of this.vertices) {
			objFile.push(`v ${fr(vert.x).toFixed(Mesh.exportPrecision)} ${fr(vert.y).toFixed(Mesh.exportPrecision)} ${fr(vert.z).toFixed(Mesh.exportPrecision)}`);
		}
		for (const vert of this.vertices) {
			if (!vert.hasTextureCoordinates()) {
				continue;
			}
			const tu = vert.tu;
			const tv = 1 - vert.tv;
			objFile.push(`vt ${fr(tu).toFixed(Mesh.exportPrecision)} ${fr(tv).toFixed(Mesh.exportPrecision)}`);
		}
		for (const vert of this.vertices) {
			const nx = vert.nx;
			const ny = vert.ny;
			const nz = vert.nz;
			objFile.push(`vn ${fr(nx).toFixed(Mesh.exportPrecision)} ${fr(ny).toFixed(Mesh.exportPrecision)} ${fr(nz).toFixed(Mesh.exportPrecision)}`);
		}
	}

	/* istanbul ignore next: Only used for debugging */
	private _writeFaceInfoLong(objFile: string[]): void {
		const faces = this.indices;
		for (let i = 0; i < this.indices.length; i += 3) {
			const values = [
				[faces[i + 2] + 1 + this.faceIndexOffset, faces[i + 2] + 1 + this.faceIndexOffset, faces[i + 2] + 1 + this.faceIndexOffset],
				[faces[i + 1] + 1 + this.faceIndexOffset, faces[i + 1] + 1 + this.faceIndexOffset, faces[i + 1] + 1 + this.faceIndexOffset],
				[faces[i] + 1 + this.faceIndexOffset, faces[i] + 1 + this.faceIndexOffset, faces[i] + 1 + this.faceIndexOffset],
			];
			objFile.push(`f ` + values.map(v => v.join('/')).join(' '));
		}
	}
}
