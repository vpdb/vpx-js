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

import { Table } from '../..';
import { EdgeSet } from '../../math/edge-set';
import { degToRad } from '../../math/float';
import { clamp } from '../../math/functions';
import {
	permuteVertices,
	ProgMeshFloat3,
	ProgMeshTriData,
	progressiveMesh,
	remapIndices,
} from '../../math/progressive-mesh';
import { Vertex3DNoTex2 } from '../../math/vertex';
import { Vertex3D } from '../../math/vertex3d';
import { CollisionType } from '../../physics/collision-type';
import { FireEvents } from '../../physics/fire-events';
import { HitObject } from '../../physics/hit-object';
import { HitPoint } from '../../physics/hit-point';
import { HitTriangle } from '../../physics/hit-triangle';
import { Mesh } from '../mesh';
import { PrimitiveData } from './primitive-data';

export class PrimitiveHitGenerator {

	private readonly data: PrimitiveData;

	constructor(data: PrimitiveData) {
		this.data = data;
	}

	public generateHitObjects(mesh: Mesh, fireEvents: FireEvents, table: Table): Array<HitObject<FireEvents>> {

		const hitObjects: Array<HitObject<FireEvents>> = [];

		if (this.data.getName() === 'playfield_mesh') {
			this.data.isVisible = false;
			this.data.useAsPlayfield = true;
		}

		// playfield can't be a toy
		if (this.data.isToy && !this.data.useAsPlayfield) {
			return [];
		}

		// FIXME wtf is this
		// RecalculateMatrices();
		// TransformVertices(); //!! could also only do this for the optional reduced variant!

		const reducedVertices = Math.floor(Math.max(
			Math.pow(mesh.vertices.length, clamp(1 - this.data.collisionReductionFactor, 0, 1) * 0.25 + 0.75),
			420, // 420 = magic
		));

		if (reducedVertices < mesh.vertices.length) {
			mesh = this.getReducedMesh(mesh, reducedVertices);
		}
		const addedEdges = new EdgeSet();

		// add collision triangles and edges
		for (let i = 0; i < mesh.indices.length; i += 3) {
			const i0 = mesh.indices[i];
			const i1 = mesh.indices[i + 1];
			const i2 = mesh.indices[i + 2];

			// NB: HitTriangle wants CCW vertices, but for rendering we have them in CW order
			const rgv3D: Vertex3D[] = [
				mesh.vertices[i0].getVertex(),
				mesh.vertices[i2].getVertex(),
				mesh.vertices[i1].getVertex(),
			];

			hitObjects.push(new HitTriangle(rgv3D));

			hitObjects.push(...addedEdges.addHitEdge(i0, i1, rgv3D[0], rgv3D[2]));
			hitObjects.push(...addedEdges.addHitEdge(i1, i2, rgv3D[2], rgv3D[1]));
			hitObjects.push(...addedEdges.addHitEdge(i2, i0, rgv3D[1], rgv3D[0]));
		}

		// add collision vertices
		for (const vertex of mesh.vertices) {
			hitObjects.push(new HitPoint(vertex.getVertex()));
		}
		//}
		return this.updateCommonParameters(hitObjects, fireEvents, table);
	}

	public getReducedMesh(mesh: Mesh, reducedVertices: number): Mesh {
		const progVertices: ProgMeshFloat3[] = [];
		for (let i = 0; i < mesh.vertices.length; ++i) { // opt. use original data directly!
			progVertices[i] = new ProgMeshFloat3(
				mesh.vertices[i].x,
				mesh.vertices[i].y,
				mesh.vertices[i].z,
			);
		}
		const progIndices: ProgMeshTriData[] = [];
		let i2 = 0;
		for (let i = 0; i < mesh.indices.length; i += 3) {
			const t = new ProgMeshTriData([
				mesh.indices[i],
				mesh.indices[i + 1],
				mesh.indices[i + 2],
			]);
			if (t.v[0] !== t.v[1] && t.v[1] !== t.v[2] && t.v[2] !== t.v[0]) {
				progIndices[i2++] = t;
			}
		}
		const [ progMap, progPerm ] = progressiveMesh(progVertices, progIndices);
		permuteVertices(progPerm, progVertices, progIndices);

		const progNewIndices: ProgMeshTriData[] = [];
		remapIndices(reducedVertices, progIndices, progNewIndices, progMap);

		const reducedIndices: number[] = [];
		for (const index of progNewIndices) {
			reducedIndices.push(index.v[0]);
			reducedIndices.push(index.v[1]);
			reducedIndices.push(index.v[2]);
		}
		return new Mesh(
			progVertices.map(pv => Vertex3DNoTex2.fromArray([pv.x, pv.y, pv.z, 0, 0, 0, 0, 0])),
			reducedIndices,
		);
	}

	private updateCommonParameters(hitObjects: Array<HitObject<FireEvents>>, fireEvents: FireEvents, table: Table): Array<HitObject<FireEvents>> {
		const mat = table.getMaterial(this.data.szPhysicsMaterial);
		for (const obj of hitObjects) {
			if (!this.data.useAsPlayfield) {
				if (mat && !this.data.overwritePhysics) {
					obj.setElasticity(mat.fElasticity, mat.fElasticityFalloff);
					obj.setFriction(mat.fFriction);
					obj.setScatter(degToRad(mat.fScatterAngle));

				} else {
					obj.setElasticity(this.data.elasticity, this.data.elasticityFalloff);
					obj.setFriction(this.data.friction);
					obj.setScatter(degToRad(this.data.scatter));
				}

				obj.setEnabled(this.data.isCollidable);

			} else {
				obj.setElasticity(table.data!.elasticity, table.data!.elasticityFalloff);
				obj.setFriction(table.data!.friction);
				obj.setScatter(degToRad(table.data!.scatter));
				obj.setEnabled(true);
			}
			obj.threshold = this.data.threshold;
			obj.setType(CollisionType.Primitive);
			obj.obj = fireEvents;
			obj.e = true;
			obj.fe = this.data.hitEvent;
		}
		return hitObjects;
	}
}
