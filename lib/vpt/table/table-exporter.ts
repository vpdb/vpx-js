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

import { Scene } from 'three';
import { exportGltf } from '../../refs.node';
import { MeshConvertOptions } from '../../render/irender-api';
import { ThreeRenderApi } from '../../render/threejs/three-render-api';
import { Table, TableGenerateOptions } from './table';
import { TableMeshGenerator } from './table-mesh-generator';

export class TableExporter {

	private readonly table: Table;
	private readonly meshGenerator: TableMeshGenerator;

	constructor(table: Table) {
		this.table = table;
		this.meshGenerator = new TableMeshGenerator(table);
	}

	// public async exportGltf(): Promise<string> {
	// 	this.opts.gltfOptions!.binary = false;
	// 	return JSON.stringify(await this.export<any>());
	// }

	public async exportGlb(opts: TableExportOptions = {}): Promise<Buffer> {
		opts = Object.assign({}, defaultOptions, opts);
		opts.gltfOptions!.binary = true;
		return await this.export<Buffer>(opts);
	}

	private async export<T>(opts: TableExportOptions): Promise<T> {
		// we always use Three.js for GLTF generation
		const renderApi = new ThreeRenderApi();
		const playfieldGroup = await this.meshGenerator.generateTableNode(renderApi, opts);

		const scene = new Scene();
		scene.name = 'table';
		scene.add(playfieldGroup);

		// now, export to GLTF
		return exportGltf(scene, opts, opts.gltfOptions);
	}
}

export interface TableExportOptions extends TableGenerateOptions, MeshConvertOptions { }

const defaultOptions: TableExportOptions = {
	applyMaterials: true,
	applyTextures: true,
	optimizeTextures: false,
	exportPlayfield: true,
	exportPrimitives: true,
	exportRubbers: true,
	exportSurfaces: true,
	exportFlippers: true,
	exportBumpers: true,
	exportRamps: true,
	exportPlayfieldLights: false,
	exportLightBulbs: true,
	exportLightBulbLights: true,
	exportHitTargets: true,
	exportGates: true,
	exportKickers: true,
	exportTriggers: true,
	exportSpinners: true,
	exportPlungers: true,
	gltfOptions: {},
};
