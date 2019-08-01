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
import { IHittable } from '../../game/ihittable';
import { IMovable } from '../../game/imovable';
import { IPlayable } from '../../game/iplayable';
import { IRenderable } from '../../game/irenderable';
import { TableExporter, VpTableExporterOptions } from '../../gltf/table-exporter';
import { IBinaryReader, Storage } from '../../io/ole-doc';
import { f4 } from '../../math/float';
import { FRect3D } from '../../math/frect3d';
import { logger } from '../../util/logger';
import { Bumper } from '../bumper/bumper';
import { Flipper } from '../flipper/flipper';
import { Gate } from '../gate/gate';
import { HitTarget } from '../hit-target/hit-target';
import { Meshes } from '../item-data';
import { Kicker } from '../kicker/kicker';
import { Light } from '../light/light';
import { Material } from '../material';
import { Plunger } from '../plunger/plunger';
import { Primitive } from '../primitive/primitive';
import { Ramp } from '../ramp/ramp';
import { Rubber } from '../rubber/rubber';
import { Spinner } from '../spinner/spinner';
import { Surface } from '../surface/surface';
import { TextBoxItem } from '../textbox-item';
import { Texture } from '../texture';
import { TimerItem } from '../timer-item';
import { Trigger } from '../trigger/trigger';
import { TableData } from './table-data';
import { LoadedTable, TableLoader } from './table-loader';
import { TableMeshGenerator } from './table-mesh-generator';

/**
 * A Visual Pinball table.
 *
 * This holds together all table elements of a .vpt/.vpx file. It's also
 * the entry point for parsing the file.
 */
export class Table implements IRenderable {

	public readonly data?: TableData;
	public readonly info?: { [key: string]: string };

	public readonly textures: { [key: string]: Texture } = {};

	public readonly bumpers: { [key: string]: Bumper } = {};
	public readonly flippers: { [key: string]: Flipper } = {};
	public readonly gates: { [key: string]: Gate } = {};
	public readonly hitTargets: { [key: string]: HitTarget } = {};
	public readonly kickers: { [key: string]: Kicker } = {};
	public readonly lights: { [key: string]: Light } = {};
	public readonly plungers: { [key: string]: Plunger } = {};
	public readonly primitives: { [key: string]: Primitive } = {};
	public readonly ramps: { [key: string]: Ramp } = {};
	public readonly rubbers: { [key: string]: Rubber } = {};
	public readonly spinners: { [key: string]: Spinner } = {};
	public readonly surfaces: { [key: string]: Surface } = {};
	public readonly textBoxes: { [key: string]: TextBoxItem } = {};
	public readonly timers: { [key: string]: TimerItem } = {};
	public readonly triggers: { [key: string]: Trigger } = {};

	private readonly meshGenerator?: TableMeshGenerator;
	private readonly loader: TableLoader;

	public static playfieldThickness = 20.0;

	public static async load(reader: IBinaryReader, opts?: TableLoadOptions): Promise<Table> {
		const tableLoader = new TableLoader();
		return new Table(tableLoader, await tableLoader.load(reader, opts));
	}

	private constructor(loader: TableLoader, loadedTable: LoadedTable) {
		this.loader = loader;
		if (loadedTable.data) {
			this.data = loadedTable.data;
			this.meshGenerator = new TableMeshGenerator(loadedTable.data);
		}
		if (loadedTable.info) {
			this.info = loadedTable.info;
		}
		if (this.isLoaded(loadedTable.textures)) {
			for (const item of loadedTable.textures!) {
				this.textures[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.bumpers)) {
			for (const item of loadedTable.bumpers!) {
				this.bumpers[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.flippers)) {
			for (const item of loadedTable.flippers!) {
				this.flippers[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.gates)) {
			for (const item of loadedTable.gates!) {
				this.gates[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.hitTargets)) {
			for (const item of loadedTable.hitTargets!) {
				this.hitTargets[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.kickers)) {
			for (const item of loadedTable.kickers!) {
				this.kickers[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.lights)) {
			for (const item of loadedTable.lights!) {
				this.lights[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.plungers)) {
			for (const item of loadedTable.plungers!) {
				this.plungers[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.primitives)) {
			for (const item of loadedTable.primitives!) {
				this.primitives[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.ramps)) {
			for (const item of loadedTable.ramps!) {
				this.ramps[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.rubbers)) {
			for (const item of loadedTable.rubbers!) {
				this.rubbers[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.spinners)) {
			for (const item of loadedTable.spinners!) {
				this.spinners[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.surfaces)) {
			for (const item of loadedTable.surfaces!) {
				this.surfaces[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.textBoxes)) {
			for (const item of loadedTable.textBoxes!) {
				this.textBoxes[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.timers)) {
			for (const item of loadedTable.timers!) {
				this.timers[item.getName()] = item;
			}
		}
		if (this.isLoaded(loadedTable.triggers)) {
			for (const item of loadedTable.triggers!) {
				this.triggers[item.getName()] = item;
			}
		}
	}

	public getName(): string {
		return this.data!.getName();
	}

	public getTexture(name?: string): Texture | undefined {
		if (!name) {
			return undefined;
		}
		return this.textures[name.toLowerCase()];
	}

	public getMaterial(name?: string): Material | undefined {
		if (!name) {
			return undefined;
		}
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		return this.data.materials.find(m => m.szName === name);
	}

	public getBoundingBox(): FRect3D {
		return new FRect3D(this.data!.left, this.data!.right, this.data!.top, this.data!.bottom, this.getTableHeight(), this.data!.glassheight);
	}

	public getPlayables(): IPlayable[] {
		return [ ...Object.values(this.flippers), ...Object.values(this.plungers) ];
	}

	public getMovables(): Array<IMovable<any>> {
		return [ ...Object.values(this.flippers), ...Object.values(this.plungers) ];
	}

	public getHittables(): IHittable[] {
		return [
			...Object.values(this.flippers),
			...Object.values(this.surfaces),
			...Object.values(this.rubbers),
			...Object.values(this.plungers),
		];
	}

	public getScaleZ(): number {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		return f4(this.data.BG_scalez[this.data.BG_current_set]) || 1.0;
	}

	public getDetailLevel() {
		return 10; // todo check if true
	}

	public getTableHeight() {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		return this.data.tableheight;
	}

	public getDimensions(): { width: number, height: number } {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		return {
			width: this.data.right - this.data.left,
			height: this.data.bottom - this.data.top,
		};
	}

	public getPlayfieldMap(): string {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		return this.data.szImage || '';
	}

	public getSurfaceHeight(surface: string | undefined, x: number, y: number) {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		if (!surface) {
			return this.data.tableheight;
		}

		if (this.surfaces[surface]) {
			return f4(this.data.tableheight + this.surfaces[surface].heightTop);
		}

		if (this.ramps[surface]) {
			return f4(this.data.tableheight + this.ramps[surface].getSurfaceHeight(x, y, this));
		}

		/* istanbul ignore next */
		logger().warn('[Table.getSurfaceHeight] Unknown surface %s.', surface);
		return this.data.tableheight;
	}

	public async exportScene(opts?: VpTableExporterOptions): Promise<Scene> {
		const exporter = new TableExporter(this, opts || {});
		return await exporter.createScene();
	}

	public async exportGltf(opts?: VpTableExporterOptions): Promise<string> {
		const exporter = new TableExporter(this, opts || {});
		return await exporter.exportGltf();
	}

	public async exportGlb(opts?: VpTableExporterOptions): Promise<Buffer> {
		const exporter = new TableExporter(this, opts || {});
		return await exporter.exportGlb();
	}

	public async streamStorage<T>(name: string, streamer: (stg: Storage) => Promise<T>): Promise<T> {
		return this.loader.streamStorage(name, streamer);
	}

	public async getTableScript(): Promise<string> {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		return await this.loader.getTableScript(this.data!);
	}

	public isVisible(): boolean {
		return true;
	}

	public getMeshes(table: Table, opts: VpTableExporterOptions): Meshes {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		const geometry = this.meshGenerator!.getMesh(this, opts);
		return {
			playfield: {
				geometry,
				material: this.getMaterial(this.data.szPlayfieldMaterial),
				map: this.getTexture(this.data.szImage),
			},
		};
	}

	private isLoaded(items: any[] | undefined) {
		return items && items.length > 0;
	}
}

export interface TableLoadOptions {
	/**
	 * If set, don't parse game items but only game data (faster).
	 */
	tableDataOnly?: boolean;

	/**
	 * If set, ignore game storage and only parse table info.
	 */
	tableInfoOnly?: boolean;

	/**
	 * If set, also parse items like timers, i.e. non-visible items.
	 */
	loadInvisibleItems?: boolean;
}
