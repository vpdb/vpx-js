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

import { IRenderApi } from '../render/irender-api';
import { ItemState } from './item-state';
import { Table } from './table/table';
import { Matrix3D } from '../math/matrix3d';
import { degToRad } from '../math/float';
import { Vertex2D } from '../math/vertex2d';

export abstract class ItemUpdater<STATE extends ItemState> {

	protected readonly state: STATE;

	public abstract applyState<NODE, GEOMETRY, POINT_LIGHT>(
		obj: NODE,
		state: STATE,
		renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>,
		table: Table,
	): void;

	protected constructor(state: STATE) {
		this.state = state;
	}

	protected applyVisibility<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, state: STATE, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>) {
		// visibility
		if (state.isVisible !== undefined) {
			renderApi.applyVisibility(this.state.isVisible, obj);
		}
	}

	protected applyMaterial<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, childName: string, material: string | undefined, texture: string | undefined, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, table: Table) {
		// material
		if (material || texture) {
			renderApi.applyMaterial(
				renderApi.findInGroup(obj, childName),
				material ? table.getMaterial(material) : undefined,
				texture,
			);
		}
	}

	protected applyXRotation<NODE, GEOMETRY, POINT_LIGHT>(obj: NODE, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, center: Vertex2D, posZ: number, rotationZ: number, angle: number, name: string) {
		const matTransToOrigin = Matrix3D.claim().setTranslation(-center.x, -center.y, posZ);
		const matRotateToOrigin = Matrix3D.claim().rotateZMatrix(degToRad(-rotationZ));
		const matTransFromOrigin = Matrix3D.claim().setTranslation(center.x, center.y, -posZ);
		const matRotateFromOrigin = Matrix3D.claim().rotateZMatrix(degToRad(rotationZ));
		const matRotateX = Matrix3D.claim().rotateXMatrix(angle);

		const matrix = matTransToOrigin
			.multiply(matRotateToOrigin)
			.multiply(matRotateX)
			.multiply(matRotateFromOrigin)
			.multiply(matTransFromOrigin);

		const plateObj = renderApi.findInGroup(obj, name);
		renderApi.applyMatrixToNode(matrix, plateObj!);

		Matrix3D.release(matTransToOrigin, matRotateToOrigin, matTransFromOrigin, matRotateFromOrigin, matRotateX);
	}
}
