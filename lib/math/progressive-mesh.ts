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

/* tslint:disable:no-bitwise */
import { FLT_MAX, FLT_MIN } from '../vpt/mesh';

export class ProgMeshFloat3 {
	public x: number;
	public y: number;
	public z: number;

	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	public sub(b: ProgMeshFloat3): ProgMeshFloat3 {
		return new ProgMeshFloat3(this.x - b.x, this.y - b.y, this.z - b.z);
	}

	public multiplyScalar(s: number) {
		return new ProgMeshFloat3(this.x * s, this.y * s, this.z * s);
	}

	public divideScalar(s: number) {
		return this.multiplyScalar(1 / s);
	}
}

export class ProgMeshTriData {
	public readonly v: number[];

	constructor(v: number[]) {
		this.v = v;
	}
}

/**
 *  For the polygon reduction algorithm we use data structures
 *  that contain a little bit more information than the usual
 *  indexed face set type of data structure.
 *  From a vertex we wish to be able to quickly get the
 *  neighboring faces and vertices.
 */
export class ProgMeshVertex {

	/** location of point in euclidean space */
	public position: ProgMeshFloat3;
	/** place of vertex in original Array */
	public id: number;
	/** adjacent vertices */
	public neighbor: ProgMeshVertex[] = [];
	/** adjacent triangles */
	public face: ProgMeshTriangle[] = [];
	/** cached cost of collapsing edge */
	public objdist?: number;
	/** candidate vertex for collapse */
	public collapse?: ProgMeshVertex;

	constructor(v: ProgMeshFloat3, id: number) {
		this.position = v;
		this.id = id;
		vertices.push(this);
	}

	public destroy(): void {
		while (this.neighbor.length > 0) {
			removeFillWithBack(this.neighbor[0].neighbor, this);
			removeFillWithBack(this.neighbor, this.neighbor[0]);
		}
		removeFillWithBack(vertices, this);
	}

	public removeIfNonNeighbor(n: ProgMeshVertex): void {
		// removes n from neighbor Array if n isn't a neighbor.
		if (!this.neighbor.includes(n)) {
			return;
		}
		for (const face of this.face) {
			if (face.hasVertex(n)) {
				return;
			}
		}
		removeFillWithBack(this.neighbor, n);
	}
}

function removeFillWithBack<T>(c: T[], t: T) {
	const idxOf = c.indexOf(t);
	const val = c.pop();
	if (idxOf === c.length) {
		return;
	}
	c[idxOf] = val!;
}

export class ProgMeshTriangle {
	/** the 3 points that make this tri */
	private vertex: ProgMeshVertex[] = [];
	/** unit vector othogonal to this face */
	public normal!: ProgMeshFloat3;

	constructor(v0: ProgMeshVertex, v1: ProgMeshVertex, v2: ProgMeshVertex) {
		this.vertex[0] = v0;
		this.vertex[1] = v1;
		this.vertex[2] = v2;
		this.computeNormal();
		triangles.push(this);

		for (let i = 0; i < 3; i++) {
			this.vertex[i].face.push(this);
			for (let j = 0; j < 3; j++) {
				if (i !== j) {
					addUnique(this.vertex[i].neighbor, this.vertex[j]);
				}
			}
		}
	}

	private computeNormal() {
		const v0 = this.vertex[0].position;
		const v1 = this.vertex[1].position;
		const v2 = this.vertex[2].position;
		this.normal = cross(v1.sub(v0), v2.sub(v1));
		const l = magnitude(this.normal);
		if (l > FLT_MIN) {
			this.normal = this.normal.divideScalar(l);
		}
	}

	public hasVertex(v: ProgMeshVertex) {
		return v === this.vertex[0] || v === this.vertex[1] || v === this.vertex[2];
	}

	public destroy() {
		removeFillWithBack(triangles, this);
		for (let i = 0; i < 3; i++) {
			if (this.vertex[i]) {
				removeFillWithBack(this.vertex[i].face, this);
			}
		}

		for (let i = 0; i < 3; i++) {
			const i2 = (i + 1) % 3;
			if (this.vertex[i] && this.vertex[i2]) {
				this.vertex[i].removeIfNonNeighbor(this.vertex[i2]);
				this.vertex[i2].removeIfNonNeighbor(this.vertex[i]);
			}
		}
	}

	public replaceVertex(vold: ProgMeshVertex, vnew: ProgMeshVertex): void {
		if (vold === this.vertex[0]) {
			this.vertex[0] = vnew;

		} else if (vold === this.vertex[1]) {
			this.vertex[1] = vnew;

		} else {
			this.vertex[2] = vnew;
		}
		removeFillWithBack(vold.face, this);

		vnew.face.push(this);

		for (let i = 0; i < 3; i++) {
			vold.removeIfNonNeighbor(this.vertex[i]);
			this.vertex[i].removeIfNonNeighbor(vold);
		}

		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				if (i !== j) {
					addUnique(this.vertex[i].neighbor, this.vertex[j]);
				}
			}
		}
		this.computeNormal();
	}
}

const vertices: ProgMeshVertex[] = [];
const triangles: ProgMeshTriangle[] = [];

export function progressiveMesh(vert: ProgMeshFloat3[], tri: ProgMeshTriData[]): [number[], number[]] {
	const map: number[] = [];
	const permutation: number[] = [];

	if (vert.length === 0 || tri.length === 0) {
		return [[], []];
	}

	addVertex(vert);  // put input data into our data structures
	addFaces(tri);
	computeAllEdgeCollapseCosts(); // cache all edge collapse costs

	// reduce the object down to nothing:
	while (vertices.length > 0) {
		// get the next vertex to collapse
		const mn = minimumCostEdge();
		// keep track of this vertex, i.e. the collapse ordering
		permutation[mn.id] = vertices.length - 1;
		// keep track of vertex to which we collapse to
		map[vertices.length - 1] = mn.collapse ? mn.collapse.id : ~0;
		// Collapse this edge
		collapse(mn, mn.collapse);
	}

	// reorder the map Array based on the collapse ordering
	for (let i = 0; i < map.length; i++) {
		map[i] = map[i] === ~0 ? 0 : permutation[map[i]];
	}

	// The caller of this function should reorder their vertices
	// according to the returned "permutation".

	return [map, permutation];
}

export function permuteVertices<T>(permutation: number[], vert: T[], tri: ProgMeshTriData[]): void {

	// rearrange the vertex Array
	const tmp: T[] = [];
	for (let i = 0; i < vert.length; i++) {
		tmp[i] = vert[i];
	}
	for (let i = 0; i < vert.length; i++) {
		vert[permutation[i]] = tmp[i];
	}

	// update the changes in the entries in the triangle Array
	for (const t of tri) {
		for (let j = 0; j < 3; j++) {
			t.v[j] = permutation[t.v[j]];
		}
	}
}

export function reMapIndices(numVertices: number, triDatas: ProgMeshTriData[], newTri: ProgMeshTriData[], map: number[]) {
	for (const tri of triDatas) {
		const t = new ProgMeshTriData([
			mapVertex(tri.v[0], numVertices, map),
			mapVertex(tri.v[1], numVertices, map),
			mapVertex(tri.v[2], numVertices, map),
		]);
		//!! note:  serious optimization opportunity here,
		//  by sorting the triangles the following "continue"
		//  could have been made into a "break" statement.
		if (t.v[0] === t.v[1] || t.v[1] === t.v[2] || t.v[2] === t.v[0]) {
			continue;
		}
		newTri.push(t);
	}
}

function computeAllEdgeCollapseCosts(): void {
	// For all the edges, compute the difference it would make
	// to the model if it was collapsed.  The least of these
	// per vertex is cached in each vertex object.
	for (const vertex of vertices) {
		computeEdgeCostAtVertex(vertex);
	}
}

function computeEdgeCostAtVertex(v: ProgMeshVertex): void {
	// compute the edge collapse cost for all edges that start
	// from vertex v.  Since we are only interested in reducing
	// the object by selecting the min cost edge at each step, we
	// only cache the cost of the least cost edge at this vertex
	// (in member variable collapse) as well as the value of the
	// cost (in member variable objdist).
	if (v.neighbor.length === 0) {
		// v doesn't have neighbors so it costs nothing to collapse
		v.collapse = undefined;
		v.objdist = -0.01;
		return;
	}
	v.objdist = FLT_MAX;
	v.collapse = undefined;

	// search all neighboring edges for "least cost" edge
	for (const neighbor of v.neighbor) {
		const dist = computeEdgeCollapseCost(v, neighbor);
		if (dist < v.objdist) {
			v.collapse = neighbor;  // candidate for edge collapse
			v.objdist = dist;             // cost of the collapse
		}
	}
}

function computeEdgeCollapseCost(u: ProgMeshVertex, v: ProgMeshVertex): number {
	// if we collapse edge uv by moving u to v then how
	// much different will the model change, i.e. how much "error".
	// Texture, vertex normal, and border vertex code was removed
	// to keep this demo as simple as possible.
	// The method of determining cost was designed in order
	// to exploit small and coplanar regions for
	// effective polygon reduction.
	// Is is possible to add some checks here to see if "folds"
	// would be generated.  i.e. normal of a remaining face gets
	// flipped.  I never seemed to run into this problem and
	// therefore never added code to detect this case.

	// find the "sides" triangles that are on the edge uv
	const sides: ProgMeshTriangle[] = [];
	for (const face of u.face) {
		if (face.hasVertex(v)) {
			sides.push(face);
		}
	}

	// use the triangle facing most away from the sides
	// to determine our curvature term
	let curvature = 0;
	for (const face of u.face) {
		let minCurve = 1; // curve for face i and closer side to it
		for (const side of sides) {
			const dotProd = dot(face.normal, side.normal);	  // use dot product of face normals.
			minCurve = Math.min(minCurve, (1 - dotProd) * 0.5);
		}
		curvature = Math.max(curvature, minCurve);
	}

	// the more coplanar the lower the curvature term
	const edgeLength = magnitude(v.position.sub(u.position));
	return edgeLength * curvature;
}

function minimumCostEdge() {
	// Find the edge that when collapsed will affect model the least.
	// This funtion actually returns a Vertex, the second vertex
	// of the edge (collapse candidate) is stored in the vertex data.
	// Serious optimization opportunity here: this function currently
	// does a sequential search through an unsorted Array :-(
	// Our algorithm could be O(n*lg(n)) instead of O(n*n)
	let mn = vertices[0];
	for (const vertex of vertices) {
		if (vertex.objdist! < mn.objdist!) {
			mn = vertex;
		}
	}
	return mn;
}

function collapse(u: ProgMeshVertex, v?: ProgMeshVertex): void {

	let i: number;
	// Collapse the edge uv by moving vertex u onto v
	// Actually remove tris on uv, then update tris that
	// have u to have v, and then remove u.
	if (!v) {
		// u is a vertex all by itself so just delete it
		u.destroy();
		return;
	}
	const tmp: ProgMeshVertex[] = [];
	// make tmp a Array of all the neighbors of u
	for (i = 0; i < u.neighbor.length; i++) {
		tmp[i] = u.neighbor[i];
	}

	// delete triangles on edge uv:
	i = u.face.length;
	while (i--) {
		if (u.face[i].hasVertex(v)) {
			u.face[i].destroy();
		}
	}
	// update remaining triangles to have v instead of u
	i = u.face.length;
	while (i--) {
		u.face[i].replaceVertex(u, v);
	}
	u.destroy();

	// recompute the edge collapse costs for neighboring vertices
	for (const t of tmp) {
		computeEdgeCostAtVertex(t);
	}
}

function addVertex(vert: ProgMeshFloat3[]): void {
	for (let i = 0; i < vert.length; i++) {
		// tslint:disable-next-line:no-unused-expression
		new ProgMeshVertex(vert[i], i); //!! braindead design, actually fills up "vertices"
	}
}

function addFaces(tri: ProgMeshTriData[]): void {
	for (const t of tri) {
		// tslint:disable-next-line:no-unused-expression
		new ProgMeshTriangle(
			vertices[t.v[0]], //!! braindead design, actually fills up "triangles"
			vertices[t.v[1]],
			vertices[t.v[2]],
		);
	}
}

function addUnique<T>(c: T[], t: T) {
	if (c.indexOf(t) === -1) {
		c.push(t);
	}
}

function cross(a: ProgMeshFloat3, b: ProgMeshFloat3): ProgMeshFloat3 {
	return new ProgMeshFloat3(
		a.y * b.z - a.z * b.y,
		a.z * b.x - a.x * b.z,
		a.x * b.y - a.y * b.x,
	);
}

function magnitude(v: ProgMeshFloat3): number {
	return Math.sqrt(dot(v, v));
}

function dot(a: ProgMeshFloat3, b: ProgMeshFloat3): number {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function mapVertex(a: number, mx: number, map: number[]): number {
	while (a >= mx) {
		a = map[a];
	}
	return a;
}
