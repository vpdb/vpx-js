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

import { Group, Matrix4, Object3D } from 'three';
import { Matrix3D } from '../math/matrix3d';
import { Pool } from '../util/object-pool';
import { Mesh } from '../vpt/mesh';
import { IRenderApi } from './irender-api';

export class ThreeRenderApi implements IRenderApi<Object3D, Group> {

	public findInGroup(group: Group, name: string): Object3D | undefined {
		return group.children.find(c => c.name === name);
	}

	public applyMatrixToObject(matrix: Matrix3D, obj: Object3D): void {
		if (!obj) {
			return;
		}
		if (!obj.matrix) {
			obj.matrix = new Matrix4();
		} else {
			obj.matrix.identity();
		}
		const m4 = Pool.GENERIC.Matrix4.get();
		m4.set(
			matrix._11, matrix._21, matrix._31, matrix._41,
			matrix._12, matrix._22, matrix._32, matrix._42,
			matrix._13, matrix._23, matrix._33, matrix._43,
			matrix._14, matrix._24, matrix._34, matrix._44,
		);
		obj.applyMatrix(m4);
		Pool.GENERIC.Matrix4.release(m4);
	}

	public applyMeshToObject(mesh: Mesh, obj: Object3D): void {
		if (!obj) {
			return;
		}
		const destGeo = (obj as any).geometry;
		const srcGeo = mesh.getBufferGeometry();
		if (srcGeo.attributes.position.array.length !== destGeo.attributes.position.array.length) {
			throw new Error(`Trying to apply geometry of ${srcGeo.attributes.position.array.length} positions to ${destGeo.attributes.position.array.length} positions.`);
		}
		for (let i = 0; i < destGeo.attributes.position.array.length; i++) {
			destGeo.attributes.position.array[i] = srcGeo.attributes.position.array[i];
		}
		destGeo.attributes.position.needsUpdate = true;
	}

}
