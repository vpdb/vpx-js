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
import { ItemState } from '../vpt/item-state';
import { ItemUpdater } from '../vpt/item-updater';
import { Material } from '../vpt/material';
import { Mesh } from '../vpt/mesh';
import { Table, TableGenerateOptions } from '../vpt/table/table';
import { Texture } from '../vpt/texture';
import { IItem } from './iitem';

export interface IRenderable<STATE extends ItemState> extends IItem {
	getMeshes<NODE, GEOMETRY, POINT_LIGHT>(
		table: Table,
		renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>,
		opts: TableGenerateOptions,
	): Meshes<GEOMETRY>;

	getState(): STATE;

	getUpdater(): ItemUpdater<STATE>;
}

export function isRenderable(arg: any): arg is IRenderable<ItemState> {
	return arg.getMeshes !== undefined;
}

export interface Meshes<GEOMETRY> {
	[key: string]: RenderInfo<GEOMETRY>;
}

export interface RenderInfo<GEOMETRY> {
	isVisible: boolean;
	mesh?: Mesh;
	geometry?: GEOMETRY;
	map?: Texture;
	normalMap?: Texture;
	envMap?: Texture;
	material?: Material;
	isTransparent?: boolean;
}
