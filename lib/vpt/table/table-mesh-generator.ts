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

/* tslint:disable:no-bitwise */
import { IRenderable } from '../../game/irenderable';
import { PointLightHelper } from '../../refs.node';
import { IRenderApi } from '../../render/irender-api';
import { Bumper } from '../bumper/bumper';
import { Flipper } from '../flipper/flipper';
import { ItemState } from '../item-state';
import { Primitive } from '../primitive/primitive';
import { Ramp } from '../ramp/ramp';
import { Rubber } from '../rubber/rubber';
import { Surface } from '../surface/surface';
import { Table, TableGenerateOptions } from './table';

export class TableMeshGenerator {

	private readonly table: Table;

	constructor(table: Table) {
		this.table = table;
	}

	public generateTableNode<NODE, GEOMETRY, POINT_LIGHT>(renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, opts: TableGenerateOptions = {}): NODE {

		opts = Object.assign({}, defaultOptions, opts);
		const tableNode = renderApi.createParentNode('playfield');
		renderApi.transformScene(tableNode, this.table);
		const renderGroups: IRenderGroup[] = [
			{ name: 'playfield', meshes: [ this.table ], enabled: !!opts.exportPlayfield },
			{ name: 'primitives', meshes: Object.values<Primitive>(this.table.primitives), enabled: !!opts.exportPrimitives },
			{ name: 'rubbers', meshes: Object.values<Rubber>(this.table.rubbers), enabled: !!opts.exportRubbers },
			{ name: 'surfaces', meshes: Object.values<Surface>(this.table.surfaces), enabled: !!opts.exportSurfaces},
			{ name: 'flippers', meshes: Object.values<Flipper>(this.table.flippers), enabled: !!opts.exportFlippers},
			{ name: 'bumpers', meshes: Object.values<Bumper>(this.table.bumpers), enabled: !!opts.exportBumpers },
			{ name: 'ramps', meshes: Object.values<Ramp>(this.table.ramps), enabled: !!opts.exportRamps },
			{ name: 'lightBulbs', meshes: Object.values(this.table.lights).filter(l => l.isBulbLight()), enabled: !!opts.exportLightBulbs },
			{ name: 'playfieldLights', meshes: Object.values(this.table.lights).filter(l => l.isSurfaceLight(this.table)), enabled: !!opts.exportPlayfieldLights },
			{ name: 'hitTargets', meshes: Object.values(this.table.hitTargets), enabled: !!opts.exportHitTargets },
			{ name: 'gates', meshes: Object.values(this.table.gates), enabled: !!opts.exportGates },
			{ name: 'kickers', meshes: Object.values(this.table.kickers), enabled: !!opts.exportKickers },
			{ name: 'triggers', meshes: Object.values(this.table.triggers), enabled: !!opts.exportTriggers },
			{ name: 'spinners', meshes: Object.values(this.table.spinners), enabled: !!opts.exportSpinners },
			{ name: 'plungers', meshes: Object.values(this.table.plungers), enabled: !!opts.exportPlungers },
		];

		// meshes
		for (const group of renderGroups) {
			if (!group.enabled) {
				continue;
			}
			const itemTypeGroup = renderApi.createParentNode(group.name);
			for (const renderable of group.meshes) {
				const itemGroup = renderApi.createObjectFromRenderable(renderable, this.table, opts);
				renderApi.addChildToParent(itemTypeGroup, itemGroup);
			}
			renderApi.addChildToParent(tableNode, itemTypeGroup);
		}

		// light bulb lights
		if (opts.exportLightBulbLights) {
			let lightGroup = renderApi.findInGroup(tableNode, 'lightBulbs');
			if (!lightGroup) {
				lightGroup = renderApi.createParentNode('lightBulbs');
				renderApi.addChildToParent(tableNode, lightGroup);
			}
			for (const lightInfo of Object.values(this.table.lights).filter(l => l.isBulbLight())) {
				let itemGroup = renderApi.findInGroup(lightGroup, lightInfo.getName());
				if (!itemGroup) {
					itemGroup = renderApi.createParentNode(lightInfo.getName());
					renderApi.addChildToParent(lightGroup, itemGroup);
				}

				const pointLight = renderApi.createPointLight(lightInfo.data);
				renderApi.addChildToParent(itemGroup, pointLight);

				// FIXME dunno why TF this is necessary to get any light at all
				//renderApi.addChildToParent(lightGroup, new PointLightHelper(pointLight as any, 10, 0xffffff) as any);
			}
		}

		// ball group
		renderApi.addChildToParent(tableNode, renderApi.createParentNode('balls'));

		return tableNode;
	}

	public getPlayfieldMesh<NODE, GEOMETRY, POINT_LIGHT>(renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, opts: TableGenerateOptions): GEOMETRY {
		return renderApi.createPlayfieldGeometry(this.table, opts);
	}
}

interface IRenderGroup {
	name: string;
	meshes: Array<IRenderable<ItemState>>;
	enabled: boolean;
}

const defaultOptions: TableGenerateOptions = {
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
