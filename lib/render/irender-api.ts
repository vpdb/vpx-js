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
import { LightData } from '../vpt/light/light-data';
import { Mesh } from '../vpt/mesh';
import { Table, TableGenerateOptions } from '../vpt/table/table';

export interface IRenderApi<NODE, GEOMETRY, POINT_LIGHT> {

	transformScene(scene: NODE, table: Table): void;

	createGroup(name: string): NODE;

	addToGroup(group: NODE, obj: NODE | POINT_LIGHT): void;

	findInGroup(group: NODE, name: string): NODE | undefined;

	removeFromGroup(group: NODE, obj: NODE | undefined): void;

	applyMatrixToObject(matrix: Matrix3D, obj: NODE | undefined): void;

	applyMeshToObject(mesh: Mesh, obj: NODE | undefined): void;

	createObjectFromRenderable(renderable: IRenderable, table: Table, opts: TableGenerateOptions): Promise<NODE>;

	createLightGeometry(lightData: LightData, table: Table): GEOMETRY;

	createPlayfieldGeometry(table: Table, opts: TableGenerateOptions): GEOMETRY;

	createPointLight(lightData: LightData): POINT_LIGHT;
}

export interface MeshConvertOptions {
	applyMaterials?: boolean;
	applyTextures?: boolean;
	optimizeTextures?: boolean;
}

export interface TableExportOptions extends TableGenerateOptions, MeshConvertOptions { }
