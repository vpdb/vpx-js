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

import { BufferGeometry, Material as ThreeMaterial, MeshStandardMaterial } from 'three';
import { Material } from '../vpt/material';
import { Mesh } from '../vpt/mesh';
import { Table } from '../vpt/table/table';
import { TableExportOptions } from '../vpt/table/table-exporter';
import { Texture } from '../vpt/texture';
import { IItem } from './iitem';

export interface IRenderable extends IItem {

	getMeshes(table: Table, opts: TableExportOptions): Meshes;

	isVisible(table: Table): boolean;

	postProcessMaterial?(table: Table, geometry: BufferGeometry, material: MeshStandardMaterial): MeshStandardMaterial | MeshStandardMaterial[];
}

export interface Meshes {
	[key: string]: RenderInfo;
}

export interface RenderInfo {
	mesh?: Mesh;
	geometry?: BufferGeometry;
	map?: Texture;
	normalMap?: Texture;
	material?: Material;
	threeMaterial?: ThreeMaterial;
}
