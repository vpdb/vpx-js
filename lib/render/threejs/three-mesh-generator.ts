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

import { Vertex3DNoTex2 } from '../../math/vertex';
import {
	BufferGeometry,
	Float32BufferAttribute,
	Geometry,
	Line,
	Matrix3,
	Mesh as ThreeMesh,
	Object3D,
	Vector2,
	Vector3,
} from '../../refs.node';
import { logger } from '../../util/logger';
import { Pool } from '../../util/object-pool';
import { Mesh } from '../../vpt/mesh';
import { ThreeRenderApi } from './three-render-api';

/**
 * A class that converts the meshes we read from VPinball to Three.js meshes.
 *
 * It takes a similar approach as Three's OBJLoader, e.g. first read data into
 * a "state" and then convert it into BufferGeometries.
 */
export class ThreeMeshGenerator {

	private readonly faceVertices: number[][] = [new Array(3), new Array(3), new Array(3)];

	public convertToBufferGeometry(mesh: Mesh): BufferGeometry {

		const state = ParserState.claim(mesh.name);

		// vertices, normals, uvs
		for (const vertex of mesh.vertices) {
			state.vertices.push(vertex.x, vertex.y, vertex.z);
			state.normals.push(vertex.nx, vertex.ny, vertex.nz);
			if (vertex.hasTextureCoordinates()) {
				state.uvs.push(vertex.tu, 1 - vertex.tv);
			}
		}

		// faces
		for (let i = 0; i < mesh.indices.length; i += 3) {
			const i1 = mesh.indices[i + 2] + 1;
			const i2 = mesh.indices[i + 1] + 1;
			const i3 = mesh.indices[i] + 1;
			this.faceVertices[0][0] = i1;
			this.faceVertices[0][1] = i1;
			this.faceVertices[0][2] = i1;
			this.faceVertices[1][0] = i2;
			this.faceVertices[1][1] = i2;
			this.faceVertices[1][2] = i2;
			this.faceVertices[2][0] = i3;
			this.faceVertices[2][1] = i3;
			this.faceVertices[2][2] = i3;

			const v1 = this.faceVertices[0];
			for (let j = 1, jl = this.faceVertices.length - 1; j < jl; j++) {
				const v2 = this.faceVertices[j];
				const v3 = this.faceVertices[j + 1];
				state.addFace(
					v1[0], v2[0], v3[0],
					v1[1], v2[1], v3[1],
					v1[2], v2[2], v3[2],
				);
			}
		}

		// create geometry from state
		const object = state.object;
		const geometry = object.geometry;
		const bufferGeometry = ThreeRenderApi.POOL.BufferGeometry.get();

		bufferGeometry.name = mesh.name;
		bufferGeometry.setAttribute('position', RecyclableFloat32BufferAttribute.claim(geometry.vertices, 3));

		if (geometry.normals.length > 0) {
			bufferGeometry.setAttribute('normal', RecyclableFloat32BufferAttribute.claim(geometry.normals, 3));

		} else {
			bufferGeometry.computeVertexNormals();
		}

		if (geometry.uvs.length > 0) {
			bufferGeometry.setAttribute('uv', RecyclableFloat32BufferAttribute.claim(geometry.uvs, 2));
		}

		ParserState.release(state);
		return bufferGeometry;
	}
}

class ParserState {

	public static readonly POOL = new Pool(ParserState);

	public object!: ParserObject;

	public readonly vertices: number[] = [];
	public readonly normals: number[] = [];
	public readonly uvs: number[] = [];

	public static claim(name: string): ParserState {
		return ParserState.POOL.get().set(name);
	}

	public static release(...states: ParserState[]) {
		for (const state of states) {
			ParserState.POOL.release(state);
		}
	}

	public set(name: string): this {
		this.object = ParserObject.claim(name);
		return this;
	}

	public static reset(state: ParserState): void {
		state.vertices.length = 0;
		state.normals.length = 0;
		state.uvs.length = 0;
		ParserObject.release(state.object);
	}

	public addFace(a: number, b: number, c: number, ua: number, ub: number, uc: number, na: number, nb: number, nc: number) {

		const vLen = this.vertices.length;

		let ia = this.parseVertexIndex(a, vLen);
		let ib = this.parseVertexIndex(b, vLen);
		let ic = this.parseVertexIndex(c, vLen);

		this.addVertex(ia, ib, ic);

		if (ua !== undefined) {

			const uvLen = this.uvs.length;
			ia = this.parseUVIndex(ua, uvLen);
			ib = this.parseUVIndex(ub, uvLen);
			ic = this.parseUVIndex(uc, uvLen);
			this.addUV(ia, ib, ic);
		}

		if (na !== undefined) {

			// Normals are many times the same. If so, skip function call and parseInt.
			const nLen = this.normals.length;
			ia = this.parseNormalIndex(na, nLen);

			ib = na === nb ? ia : this.parseNormalIndex(nb, nLen);
			ic = na === nc ? ia : this.parseNormalIndex(nc, nLen);

			this.addNormal(ia, ib, ic);
		}
	}

	private addUV(a: number, b: number, c: number) {
		const src = this.uvs;
		const dst = this.object.geometry.uvs;
		dst.push(src[a], src[a + 1]);
		dst.push(src[b], src[b + 1]);
		dst.push(src[c], src[c + 1]);
	}

	private parseVertexIndex(index: number, len: number) {
		return (index >= 0 ? index - 1 : index + len / 3) * 3;
	}

	private parseNormalIndex(index: number, len: number) {
		return (index >= 0 ? index - 1 : index + len / 3) * 3;
	}

	private parseUVIndex(index: number, len: number) {
		return (index >= 0 ? index - 1 : index + len / 2) * 2;
	}

	private addVertex(a: number, b: number, c: number) {
		const src = this.vertices;
		const dst = this.object.geometry.vertices;
		dst.push(src[a], src[a + 1], src[a + 2]);
		dst.push(src[b], src[b + 1], src[b + 2]);
		dst.push(src[c], src[c + 1], src[c + 2]);
	}

	private addNormal(a: number, b: number, c: number) {
		const src = this.normals;
		const dst = this.object.geometry.normals;
		dst.push(src[a], src[a + 1], src[a + 2]);
		dst.push(src[b], src[b + 1], src[b + 2]);
		dst.push(src[c], src[c + 1], src[c + 2]);
	}
}

class ParserObject {
	public static readonly POOL = new Pool(ParserObject);
	public name!: string;
	public geometry: { [key: string]: number[] } = {
		vertices: [],
		normals: [],
		uvs: [],
	};
	public smooth: boolean = false;

	public static claim(name: string): ParserObject {
		return ParserObject.POOL.get().set(name);
	}

	public static release(...states: ParserObject[]) {
		for (const state of states) {
			ParserObject.POOL.release(state);
		}
	}

	public static reset(po: ParserObject): void {
		po.geometry.vertices.length = 0;
		po.geometry.normals.length = 0;
		po.geometry.uvs.length = 0;
		po.smooth = false;
	}

	public set(name: string): this {
		this.name = name;
		return this;
	}
}

export function releaseGeometry(geometry: BufferGeometry) {
	for (const attrName of Object.keys(geometry.attributes)) {
		RecyclableFloat32BufferAttribute.release(geometry.attributes[attrName] as any);
		delete geometry.attributes[attrName];
	}
	ThreeRenderApi.POOL.BufferGeometry.release(geometry);
}

class RecyclableFloat32BufferAttribute extends Float32BufferAttribute {

	public static readonly POOL = new Pool(RecyclableFloat32BufferAttribute);
	private static readonly ARR = new Float32Array();

	public static claim(array: number[], itemSize: number, normalized?: boolean): RecyclableFloat32BufferAttribute {
		return RecyclableFloat32BufferAttribute.POOL.get().set(array, itemSize, normalized);
	}

	public static release(...bas: RecyclableFloat32BufferAttribute[]) {
		for (const ba of bas) {
			RecyclableFloat32BufferAttribute.POOL.release(ba);
		}
	}

	public set(array: number[], itemSize: number, normalized?: boolean): this {

		if (this.array.length === array.length) {
			(this.array as any).set(array);
		} else {
			this.array = new Float32Array(array);
		}
		this.itemSize = itemSize;
		this.count = array.length / itemSize;
		this.normalized = normalized === true;

		this.updateRange.offset = 0;
		this.updateRange.count = -1;

		this.version = 0;
		return this;
	}

	constructor() {
		super(RecyclableFloat32BufferAttribute.ARR, 3);
	}
}

/* istanbul ignore next: used for debugging */
export class MeshExporter {

	private output = new Mesh();

	private indexVertex = 0;
	private indexVertexUvs = 0;
	private indexNormals = 0;

	private vertex = new Vector3();
	private normal = new Vector3();
	private uv = new Vector2();

	public parse(object: Object3D): Mesh {
		object.traverse(child => {
			if (child instanceof ThreeMesh) {
				this.parseMesh(child as any);
			}

			if (child instanceof Line) {
				//this.parseLine(child);
			}
		});
		return this.output;
	}

	private parseMesh(mesh: ThreeMesh) {

		let i: number;
		let l: number;
		let m: number;

		let nbVertex = 0;
		let nbNormals = 0;
		let nbVertexUvs = 0;
		let geometry = mesh.geometry;

		const normalMatrixWorld = new Matrix3();

		if (geometry instanceof Geometry) {
			geometry = new BufferGeometry().setFromObject(mesh);
		}

		if (geometry instanceof BufferGeometry) {

			// shortcuts
			const vertices = geometry.getAttribute('position');
			const normals = geometry.getAttribute('normal');
			const uvs = geometry.getAttribute('uv');
			const indices = geometry.getIndex();

			// name of the mesh object
			this.output.name = mesh.name;

			// vertices
			if (vertices !== undefined) {
				for (i = 0, l = vertices.count; i < l; i++, nbVertex++) {
					this.vertex.x = vertices.getX(i);
					this.vertex.y = vertices.getY(i);
					this.vertex.z = vertices.getZ(i);

					// transfrom the vertex to world space
					this.vertex.applyMatrix4(mesh.matrixWorld);

					// transform the vertex to export format
					this.output.vertices.push(Vertex3DNoTex2.fromArray([this.vertex.x, this.vertex.y, this.vertex.z, 0, 0, 0, 0, 0]));
				}
			}

			// uvs
			if (uvs !== undefined) {
				for (i = 0, l = uvs.count; i < l; i++, nbVertexUvs++) {
					this.uv.x = uvs.getX(i);
					this.uv.y = uvs.getY(i);

					// transform the uv to export format
					this.output.vertices[i].tu = this.uv.x;
					this.output.vertices[i].tv = this.uv.y;
				}
			}

			// normals
			if (normals !== undefined) {
				normalMatrixWorld.getNormalMatrix(mesh.matrixWorld);
				for (i = 0, l = normals.count; i < l; i++, nbNormals++) {
					this.normal.x = normals.getX(i);
					this.normal.y = normals.getY(i);
					this.normal.z = normals.getZ(i);

					// transfrom the normal to world space
					this.normal.applyMatrix3(normalMatrixWorld);

					// transform the normal to export format
					this.output.vertices[i].nx = this.normal.x;
					this.output.vertices[i].ny = this.normal.y;
					this.output.vertices[i].nz = this.normal.z;
				}
			}

			// faces
			if (indices !== null) {
				for (i = 0, l = indices.count; i < l; i += 3) {
					for (m = 0; m < 3; m++) {
						this.output.indices.push(indices.getX(i));
					}
				}

			} else {
				for (i = 0, l = vertices.count; i < l; i += 3) {
					for (m = 0; m < 3; m++) {
						this.output.indices.push(i + m);
					}
				}
			}
		} else {
			logger().warn('MeshExporter.parseMesh(): geometry type unsupported', geometry);
		}

		// update index
		this.indexVertex += nbVertex;
		this.indexVertexUvs += nbVertexUvs;
		this.indexNormals += nbNormals;
	}
}
