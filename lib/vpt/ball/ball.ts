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

import { IMovable } from '../../game/imovable';
import { IPlayable } from '../../game/iplayable';
import { IRenderable, Meshes } from '../../game/irenderable';
import { Player } from '../../game/player';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex3D } from '../../math/vertex3d';
import { HitObject } from '../../physics/hit-object';
import { IRenderApi } from '../../render/irender-api';
import { Material } from '../material';
import { Table } from '../table/table';
import { TableData } from '../table/table-data';
import { Texture } from '../texture';
import { BallData } from './ball-data';
import { BallHit } from './ball-hit';
import { BallMeshGenerator } from './ball-mesh-generator';
import { BallMover } from './ball-mover';
import { BallState } from './ball-state';

export class Ball implements IPlayable, IMovable<BallState>, IRenderable {

	public readonly state: BallState;
	public readonly data: BallData;
	private readonly meshGenerator: BallMeshGenerator;
	public readonly hit!: BallHit;

	// unique ID for each ball
	public readonly id: number;

	// public props
	get coll() { return this.hit.coll; }

	public static idCounter = 0;

	// ugly hacks
	public oldVel: Vertex3D = new Vertex3D();

	constructor(data: BallData, state: BallState, initialVelocity: Vertex3D, tableData: TableData) {
		this.id = Ball.idCounter++;
		this.data = data;
		this.state = state;
		this.meshGenerator = new BallMeshGenerator(data);
		if (initialVelocity) {
			this.hit = new BallHit(this, data, state, initialVelocity, tableData);
		}
	}

	public getName(): string {
		return `Ball${this.id}`;
	}

	public applyState<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: BallState, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): void {
		const isFrozen = this.hit && this.hit.isFrozen;
		const pos: { _x: number, _y: number, _z: number} = state.pos as any;
		const zHeight = !isFrozen ? pos._z : pos._z - this.data.radius;
		const orientation = Matrix3D.claim().setEach(
			state.orientation.matrix[0][0], state.orientation.matrix[1][0], state.orientation.matrix[2][0], 0.0,
			state.orientation.matrix[0][1], state.orientation.matrix[1][1], state.orientation.matrix[2][1], 0.0,
			state.orientation.matrix[0][2], state.orientation.matrix[1][2], state.orientation.matrix[2][2], 0.0,
			0, 0, 0, 1,
		);
		const trans = Matrix3D.claim().setTranslation(pos._x, pos._y, zHeight);
		const matrix = Matrix3D.claim()
			.setScaling(this.data.radius, this.data.radius, this.data.radius)
			.preMultiply(orientation)
			.multiply(trans)
			.toRightHanded();

		renderApi.applyMatrixToNode(matrix, obj);
		Matrix3D.release(orientation, trans, matrix);
	}

	public async addToScene<NODE, GEOMETRY, POINT_LIGHT>(scene: NODE, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table): Promise<NODE> {
		const ballMesh = await renderApi.createObjectFromRenderable(this, table, {});
		const playfield = renderApi.findInGroup(scene, 'playfield')!;
		const ballGroup = renderApi.findInGroup(playfield, 'balls')!;
		renderApi.addChildToParent(ballGroup, ballMesh);
		return ballMesh;
	}

	public removeFromScene<NODE, GEOMETRY, POINT_LIGHT>(scene: NODE, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>): void {
		const playfield = renderApi.findInGroup(scene, 'playfield')!;
		const ballGroup = renderApi.findInGroup(playfield, 'balls')!;
		const ball = renderApi.findInGroup(ballGroup, this.getName());
		renderApi.removeFromParent(ballGroup, ball);
	}

	public getState(): BallState {
		return this.state;
	}

	public getMover(): BallMover {
		return this.hit.getMoverObject();
	}

	/* istanbul ignore next: never called since there is no ball at player setup */
	public setupPlayer(): void {
		// there is no ball yet on player setup
	}

	/* istanbul ignore next: never called since balls have their own hit collection */
	public getHitShapes(): HitObject[] {
		return [ this.hit ];
	}

	public getMeshes<GEOMETRY>(table: Table): Meshes<GEOMETRY> {
		return {
			ball: {
				mesh: this.meshGenerator.getMesh().transform(Matrix3D.RIGHT_HANDED),
				envMap: Texture.fromFilesystem('ball.png'),
				material: this.getMaterial(),
			},
		};
	}

	/* istanbul ignore next: balls have their own visibility treatment */
	public isVisible(table: Table): boolean {
		return true;
	}

	/* istanbul ignore next: balls have their own collidable treatment */
	public isCollidable(): boolean {
		return true;
	}

	private getMaterial(): Material {
		const material = new Material();
		material.name = 'ball';
		material.isMetal = true;
//		material.baseColor = 0x000
		material.roughness = 0.4;
		return material;
	}
}
