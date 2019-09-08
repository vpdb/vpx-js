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

import { IRenderable } from '../game/irenderable';
import { Matrix3D } from '../math/matrix3d';
import { Mesh } from '../vpt/mesh';
import { Table } from '../vpt/table/table';

export interface IRenderApi<OBJECT, GROUP> {

	addToGroup(group: GROUP, obj: OBJECT | GROUP): void;

	findInGroup(group: GROUP, name: string): OBJECT | GROUP | undefined;

	removeFromGroup(group: GROUP, obj: OBJECT | GROUP | undefined): void;

	applyMatrixToObject(matrix: Matrix3D, obj: OBJECT | undefined): void;

	applyMeshToObject(mesh: Mesh, obj: OBJECT | undefined): void;

	createObjectFromRenderable(renderable: IRenderable, table: Table): Promise<GROUP>;
}

export interface MeshConvertOptions {
	applyMaterials?: boolean;
	applyTextures?: boolean;
	optimizeTextures?: boolean;
}
