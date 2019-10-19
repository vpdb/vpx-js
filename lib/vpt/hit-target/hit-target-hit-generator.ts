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

import { EventProxy } from '../../game/event-proxy';
import { EdgeSet } from '../../math/edge-set';
import { degToRad } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex3D } from '../../math/vertex3d';
import { CollisionType } from '../../physics/collision-type';
import { HitObject } from '../../physics/hit-object';
import { HitPoint } from '../../physics/hit-point';
import { HitTriangle } from '../../physics/hit-triangle';
import { TargetType } from '../enums';
import { Mesh } from '../mesh';
import { Table } from '../table/table';
import { HitTargetData } from './hit-target-data';
import { HitTargetMeshGenerator } from './hit-target-mesh-generator';

export class HitTargetHitGenerator {

	private readonly data: HitTargetData;
	private readonly meshGenerator: HitTargetMeshGenerator;

	constructor(data: HitTargetData, meshGenerator: HitTargetMeshGenerator) {
		this.data = data;
		this.meshGenerator = meshGenerator;
	}

	public generateHitObjects(events: EventProxy, table: Table): HitObject[] {
		if (this.data.isDropTarget()) {
			return this.generateDropTargetHits(events, table);

		} else {
			return this.generateHitTargetHits(events, table);
		}
	}

	private generateDropTargetHits(events: EventProxy, table: Table): HitObject[] {

		const addedEdges = new EdgeSet();
		const hitMesh = this.meshGenerator.generateMesh(table);
		const hitObjects = this.generateCollidables(hitMesh, addedEdges, this.data.legacy, events, table);

		const tempMatrix = new Matrix3D().rotateZMatrix(degToRad(this.data.rotZ));
		const fullMatrix = new Matrix3D().multiply(tempMatrix);

		if (!this.data.legacy) {

			const rgv3D: Vertex3D[] = [];
			let hitShapeOffset = 0.18;
			if (this.data.targetType === TargetType.DropTargetBeveled) {
				hitShapeOffset = 0.25;
			}
			if (this.data.targetType === TargetType.DropTargetFlatSimple) {
				hitShapeOffset = 0.13;
			}

			// now create a special hit shape with hit event enabled to prevent a hit event when hit from behind
			for (const dropTargetHitPlaneVertex of dropTargetHitPlaneVertices) {
				const vert = new Vertex3D(dropTargetHitPlaneVertex.x, dropTargetHitPlaneVertex.y + hitShapeOffset, dropTargetHitPlaneVertex.z);
				vert.x *= this.data.vSize.x;
				vert.y *= this.data.vSize.y;
				vert.z *= this.data.vSize.z;
				vert.multiplyMatrix(fullMatrix);
				rgv3D.push(new Vertex3D(
					vert.x + this.data.vPosition.x,
					vert.y + this.data.vPosition.y,
					vert.z * table.getScaleZ() + this.data.vPosition.z + table.getTableHeight(),
				));
			}

			for (let i = 0; i < dropTargetHitPlaneIndices.length; i += 3) {
				const i0 = dropTargetHitPlaneIndices[i];
				const i1 = dropTargetHitPlaneIndices[i + 1];
				const i2 = dropTargetHitPlaneIndices[i + 2];

				// NB: HitTriangle wants CCW vertices, but for rendering we have them in CW order
				const rgv3D2: Vertex3D[] = [rgv3D[i0], rgv3D[i2], rgv3D[i1]];

				hitObjects.push(this.setupHitObject(new HitTriangle(rgv3D2), events, true, table));
				hitObjects.push(...addedEdges.addHitEdge(i0, i1, rgv3D2[0], rgv3D2[2]).map(obj => this.setupHitObject(obj, events, true, table)));
				hitObjects.push(...addedEdges.addHitEdge(i1, i2, rgv3D2[2], rgv3D2[1]).map(obj => this.setupHitObject(obj, events, true, table)));
				hitObjects.push(...addedEdges.addHitEdge(i2, i0, rgv3D2[1], rgv3D2[0]).map(obj => this.setupHitObject(obj, events, true, table)));
			}

			// add collision vertices
			for (let i = 0; i < dropTargetHitPlaneVertices.length; ++i) {
				hitObjects.push(this.setupHitObject(new HitPoint(rgv3D[i]), events, true, table));
			}
		}
		return hitObjects;
	}

	private generateHitTargetHits(events: EventProxy, table: Table): HitObject[] {
		const addedEdges = new EdgeSet();
		const hitMesh = this.meshGenerator.generateMesh(table);
		return this.generateCollidables(hitMesh, addedEdges, true, events, table);
	}

	private generateCollidables(hitMesh: Mesh, addedEdges: EdgeSet, setHitObject: boolean, events: EventProxy, table: Table): HitObject[] {

		const hitObjects: HitObject[] = [];

		// add the normal drop target as collidable but without hit event
		for (let i = 0; i < hitMesh.indices.length; i += 3) {
			const i0 = hitMesh.indices[i];
			const i1 = hitMesh.indices[i + 1];
			const i2 = hitMesh.indices[i + 2];

			// NB: HitTriangle wants CCW vertices, but for rendering we have them in CW order
			const rgv3D: Vertex3D[] = [
				new Vertex3D(hitMesh.vertices[i0].x, hitMesh.vertices[i0].y, hitMesh.vertices[i0].z),
				new Vertex3D(hitMesh.vertices[i2].x, hitMesh.vertices[i2].y, hitMesh.vertices[i2].z),
				new Vertex3D(hitMesh.vertices[i1].x, hitMesh.vertices[i1].y, hitMesh.vertices[i1].z),
			];

			hitObjects.push(this.setupHitObject(new HitTriangle(rgv3D), events, setHitObject, table));
			hitObjects.push(...addedEdges.addHitEdge(i0, i1, rgv3D[0], rgv3D[2]).map(obj => this.setupHitObject(obj, events, setHitObject, table)));
			hitObjects.push(...addedEdges.addHitEdge(i1, i2, rgv3D[2], rgv3D[1]).map(obj => this.setupHitObject(obj, events, setHitObject, table)));
			hitObjects.push(...addedEdges.addHitEdge(i2, i0, rgv3D[1], rgv3D[0]).map(obj => this.setupHitObject(obj, events, setHitObject, table)));
		}

		// add collision vertices
		for (const vertex of hitMesh.vertices) {
			hitObjects.push(this.setupHitObject(new HitPoint(vertex.getVertex()), events, setHitObject, table));
		}
		return hitObjects;
	}

	private setupHitObject(obj: HitObject, events: EventProxy, setHitObject: boolean, table: Table): HitObject {
		obj.applyPhysics(this.data, table);
		obj.threshold = this.data.threshold;
		obj.setType(CollisionType.HitTarget);
		obj.obj = events;
		obj.fe = setHitObject && this.data.useHitEvent;
		return obj;
	}
}

const dropTargetHitPlaneVertices: Vertex3D[] = [
	new Vertex3D(-0.300000, 0.001737, -0.160074),
	new Vertex3D(-0.300000, 0.001738, 0.439926),
	new Vertex3D(0.300000, 0.001738, 0.439926),
	new Vertex3D(0.300000, 0.001737, -0.160074),
	new Vertex3D(-0.500000, 0.001738, 0.439926),
	new Vertex3D(-0.500000, 0.001738, 1.789926),
	new Vertex3D(0.500000, 0.001738, 1.789926),
	new Vertex3D(0.500000, 0.001738, 0.439926),
	new Vertex3D(-0.535355, 0.001738, 0.454570),
	new Vertex3D(-0.535355, 0.001738, 1.775281),
	new Vertex3D(-0.550000, 0.001738, 0.489926),
	new Vertex3D(-0.550000, 0.001738, 1.739926),
	new Vertex3D(0.535355, 0.001738, 0.454570),
	new Vertex3D(0.535355, 0.001738, 1.775281),
	new Vertex3D(0.550000, 0.001738, 0.489926),
	new Vertex3D(0.550000, 0.001738, 1.739926),
];

const dropTargetHitPlaneIndices: number[] = [
	0, 1, 2, 2, 3, 0, 1, 4, 5, 6, 7, 2, 5, 6, 1,
	2, 1, 6, 4, 8, 9, 9, 5, 4, 8, 10, 11, 11, 9, 8,
	6, 12, 7, 12, 6, 13, 12, 13, 14, 13, 15, 14,
];
