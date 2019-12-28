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

import { Table } from '../vpt/table/table';
import { GltfAccessor, GltfFile, GltfScene } from './gltf';

export class GltfExporter2 {

	private readonly table: Table;

	private readonly output: GltfFile = {
		asset: {
			version: '2.0',
		},
	};

	constructor(table: Table) {
		this.table = table;
	}

	public async export(): Promise<GltfFile> {
		this.output.scenes = [];
		this.output.scene = 0;

		const scene: GltfScene = {
			name: this.table.getName(),
			nodes: [],
		};

		return this.output;
	}

}
