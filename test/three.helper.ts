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

import { Object3D } from 'three/src/core/Object3D';
import { Mesh } from 'three/src/objects/Mesh';
import { Box3 } from 'three/src/math/Box3';
import { resolve } from 'path';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

//(global as any).TextDecoder = require('util').TextDecoder;

export class ThreeHelper {

	private readonly loader: any;

	constructor() {
		this.loader = new GLTFLoader();
	}

	async loadGlb(glb: Buffer): Promise<GLTF> {
		return new Promise((resolve, reject) => this.loader.parse(toArrayBuffer(glb), '', resolve, reject));
	}

	public first<T extends Object3D>(gltf: GLTF, groupName: string): T {
		const table = this.getTable(gltf);
		if (!table.children || !table.children.length) {
			throw new Error('GLTF table has no children!');
		}
		const objects = table.children.find((c: Object3D) => c.name === groupName);
		if (!objects) {
			throw new Error('GLTF table has no "' + groupName + '" group!');
		}
		if (!objects.children || !objects.children.length) {
			throw new Error('The "' + groupName + '" group of the GLTF table has no children.');
		}
		if (!objects.children[0].children || !objects.children[0].children.length) {
			throw new Error('The first child of the group "' + groupName + '" of the GLTF table has no children.');
		}
		return objects.children[0].children[0] as T;
	}

	public find<T extends Object3D>(gltf: GLTF, groupName: string, itemName: string, objectName?: string): T {
		const table = this.getTable(gltf);
		if (!table.children || !table.children.length) {
			throw new Error('GLTF table has no children!');
		}
		const objects = table.children.find(c => c.name === groupName);
		if (!objects) {
			throw new Error('GLTF table has no "' + groupName + '" group! (available: [' + table.children.map(c => c.name).join(', ') + '])');
		}
		if (!objects.children || !objects.children.length) {
			throw new Error('The "' + groupName + '" group of the GLTF table has no children.');
		}
		const item = objects.children.find(c => c.name === itemName);
		if (!item) {
			throw new Error('The "' + groupName + '" group of the GLTF table has no child named "' + itemName + '". (available: [' + objects.children.map(c => c.name).join(', ') + '])');
		}

		if (!objectName) {
			return item as T;
		}
		const object = item.children.find(c => c.name === objectName);
		if (!object) {
			throw new Error('Item "' + itemName + '" of group "' + groupName + '" of the GLTF table has no child named "' + objectName + '". (available: [' + item.children.map(c => c.name).join(', ') + '])');
		}
		return object as T;
	}

	public vertices(mesh: Mesh): number[] {
		return (mesh.geometry as any).attributes.position.array;
	}

	public getTable(gltf: GLTF): Object3D {
		if (!gltf || !gltf.scene || !gltf.scene.children || !gltf.scene.children.length) {
			throw new Error('Cannot find scene in GLTF.');
		}
		const table = gltf.scene.children.find(c => c.name === 'playfield');
		if (!table) {
			throw new Error('Cannot find table in GLTF.');
		}
		return table;
	}

	public expectNoObject(gltf: GLTF, groupName: string, itemName: string, objectName?: string): void {
		const table = this.getTable(gltf);
		if (!table.children || !table.children.length) {
			throw new Error('GLTF table has no children!');
		}
		const objects = table.children.find(c => c.name === groupName);
		if (!objects) {
			throw new Error('GLTF table has no "' + groupName + '" group! (available: [' + table.children.map(c => c.name).join(', ') + '])');
		}
		if (!objects.children) {
			throw new Error('The "' + groupName + '" group of the GLTF table has no children.');
		}
		const item = objects.children.find(c => c.name === itemName);

		if (objectName) {
			if (!item) {
				throw new Error('The "' + groupName + '" group of the GLTF table has no child named "' + objectName + '". (available: [' + objects.children.map(c => c.name).join(', ') + '])');
			}
			const object = item.children.find(c => c.name === objectName);
			if (object) {
				throw new Error('The "' + itemName + '" item of the "' + groupName + '" group of the GLTF table has a child named "' + objectName + '" but none was expected.');
			}
		} else {
			if (item) {
				throw new Error('The "' + groupName + '" group of the GLTF table has a child named "' + objectName + '" but none was expected.');
			}
		}

	}

	public expectObject(gltf: GLTF, groupName: string, itemName: string, objectName?: string) {
		const table = this.getTable(gltf);
		if (!table.children || !table.children.length) {
			throw new Error('GLTF table has no children!');
		}
		const objects = table.children.find(c => c.name === groupName);
		if (!objects) {
			throw new Error('GLTF table has no "' + groupName + '" group! (available: [' + table.children.map(c => c.name).join(', ') + '])');
		}
		if (!objects.children || !objects.children.length) {
			throw new Error('The "' + groupName + '" group of the GLTF table has no children.');
		}
		const item = objects.children.find(c => c.name === itemName);
		if (!item) {
			throw new Error('The "' + groupName + '" group of the GLTF table has no child named "' + objectName + '". (available: [' + objects.children.map(c => c.name).join(', ') + '])');
		}
		if (objectName) {
			const object = item.children.find(c => c.name === objectName);
			if (!object) {
				throw new Error('The "' + itemName + '" item in the "' + groupName + '" group of the GLTF table has no child named "' + objectName + '". (available: [' + item.children.map(c => c.name).join(', ') + '])');
			}
		}
	}

	public expectVerticesInArray(vertices: number[][], array: number[], accuracy?: number): void {
		accuracy = accuracy || 3;
		// create hash map of vertices
		let vertexHashes: { [key: string]: boolean } = {};
		for (let i = 0; i < array.length; i +=3) {
			vertexHashes[this.hashVertex(array.slice(i, i + 3), accuracy)] = true;
		}
		for (const expectedVertex of vertices) {
			const vertexHash = this.hashVertex(expectedVertex, accuracy);
			if (!vertexHashes[vertexHash]) {
				throw new Error('Vertex { ' + expectedVertex.join(', ') + ' } not found in array.');
			}
		}
	}

	public concatMeshes(gltf: GLTF, groupName: string, itemName: string, objectNames: string[]) {
		const arr = [];
		for (const objName of objectNames) {
			const mesh = this.find(gltf, groupName, itemName, objName) as Mesh;
			const geometry = mesh.geometry as any;
			arr.push(...geometry.attributes.position.array);
		}
		return arr;
	}

	private hashVertex(vertex: number[], accuracy: number): string {
		const trim = Math.pow(10, accuracy);
		return `${Math.round(vertex[0] * trim)},${Math.round(vertex[1] * trim)},${Math.round(vertex[2] * trim)}`;
	}

	public fixturePath(filename: string): string {
		return resolve(__dirname, 'fixtures', filename);
	}

	public resPath(filename: string): string {
		return resolve(__dirname, '..', 'res', 'maps', filename);
	}

	public getBoundingBox(object3D: Object3D): Box3 {
		let box: Box3 | null = null;
		object3D.traverse(obj3D => {
			let geometry = (obj3D as Mesh).geometry;
			if (geometry === undefined) {
				return;
			}
			geometry.computeBoundingBox();
			if (box === null) {
				box = geometry.boundingBox;
			} else {
				box.union(geometry.boundingBox);
			}
		});
		return box || new Box3();
	}
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
	const ab = new ArrayBuffer(buf.length);
	const view = new Uint8Array(ab);
	for (let i = 0; i < buf.length; ++i) {
		view[i] = buf[i];
	}
	return ab;
}
