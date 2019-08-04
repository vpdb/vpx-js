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

import { BufferGeometry, Float32BufferAttribute } from 'three';
import { Mesh } from '../vpt/mesh';

/**
 * A class that converts the meshes we read from VPinball to Three.js meshes.
 *
 * It takes a similar approach as Three's OBJLoader, e.g. first read data into
 * a "state" and then convert it into BufferGeometries.
 */
export class MeshConverter {

	private mesh: Mesh;

	constructor(mesh: Mesh) {
		this.mesh = mesh;
	}

	public convertToBufferGeometry(): BufferGeometry {

		const state = new ParserState(this.mesh.name);

		// vertices, normals, uvs
		for (const vertex of this.mesh.vertices) {
			state.vertices.push(vertex.x, vertex.y, vertex.z);
			state.normals.push(vertex.nx, vertex.ny, vertex.nz);
			if (vertex.hasTextureCoordinates()) {
				state.uvs.push(vertex.tu, 1 - vertex.tv);
			}
		}

		// faces
		for (let i = 0; i < this.mesh.indices.length; i += 3) {
			const i1 = this.mesh.indices[i + 2] + 1;
			const i2 = this.mesh.indices[i + 1] + 1;
			const i3 = this.mesh.indices[i] + 1;
			const faceVertices: number[][] = [];
			faceVertices.push([i1, i1, i1]);
			faceVertices.push([i2, i2, i2]);
			faceVertices.push([i3, i3, i3]);

			const v1 = faceVertices[0];
			for (let j = 1, jl = faceVertices.length - 1; j < jl; j++) {
				const v2 = faceVertices[j];
				const v3 = faceVertices[j + 1];
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
		const bufferGeometry = new BufferGeometry();

		bufferGeometry.name = this.mesh.name;
		bufferGeometry.addAttribute('position', new Float32BufferAttribute(geometry.vertices, 3));

		if (geometry.normals.length > 0) {
			bufferGeometry.addAttribute('normal', new Float32BufferAttribute(geometry.normals, 3));

		} else {
			bufferGeometry.computeVertexNormals();
		}

		if (geometry.uvs.length > 0) {
			bufferGeometry.addAttribute('uv', new Float32BufferAttribute(geometry.uvs, 2));
		}

		return bufferGeometry;
	}
}

class ParserState {

	public object: ParserObject;

	public readonly vertices: number[] = [];
	public readonly normals: number[] = [];
	public readonly uvs: number[] = [];

	constructor(name: string) {

		this.object = {
			name,
			geometry: {
				vertices: [],
				normals: [],
				uvs: [],
			},
			smooth: true,
		};
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

interface ParserObject {
	name: string;
	geometry: {
		vertices: number[];
		normals: number[];
		uvs: number[];
	};
	smooth: boolean;
}
