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

import { Event } from '../../game/event';
import { EventProxy } from '../../game/event-proxy';
import { IAnimatable, isAnimatable } from '../../game/ianimatable';
import { IHittable, isHittable } from '../../game/ihittable';
import { IMovable, isMovable } from '../../game/imovable';
import { IPlayable, isPlayable } from '../../game/iplayable';
import { Meshes } from '../../game/irenderable';
import { IScriptable, isScriptable } from '../../game/iscriptable';
import { Player } from '../../game/player';
import { IBinaryReader, Storage } from '../../io/ole-doc';
import { degToRad, f4 } from '../../math/float';
import { FRect3D } from '../../math/frect3d';
import { Vertex3D } from '../../math/vertex3d';
import { HitObject } from '../../physics/hit-object';
import { HitPlane } from '../../physics/hit-plane';
import { IRenderApi } from '../../render/irender-api';
import { Transpiler } from '../../scripting/transpiler';
import { logger } from '../../util/logger';
import { Bumper } from '../bumper/bumper';
import { Collection } from '../collection/collection';
import { Flasher } from '../flasher/flasher';
import { Flipper } from '../flipper/flipper';
import { Gate } from '../gate/gate';
import { HitTarget } from '../hit-target/hit-target';
import { Item } from '../item';
import { ItemData } from '../item-data';
import { ItemState } from '../item-state';
import { Kicker } from '../kicker/kicker';
import { Light } from '../light/light';
import { Material } from '../material';
import { Plunger } from '../plunger/plunger';
import { Primitive } from '../primitive/primitive';
import { Ramp } from '../ramp/ramp';
import { Rubber } from '../rubber/rubber';
import { Spinner } from '../spinner/spinner';
import { Surface } from '../surface/surface';
import { Textbox } from '../textbox/textbox';
import { Texture } from '../texture';
import { Timer } from '../timer/timer';
import { Trigger } from '../trigger/trigger';
import { TableApi } from './table-api';
import { TableData } from './table-data';
import { TableExportOptions } from './table-exporter';
import { TableHitGenerator } from './table-hit-generator';
import { LoadedTable, TableLoader } from './table-loader';
import { TableMeshGenerator } from './table-mesh-generator';

/**
 * A Visual Pinball table.
 *
 * This holds together all table elements of a .vpt/.vpx file. It's also
 * the entry point for parsing the file.
 */
export class Table implements IScriptable<TableApi> {

	public readonly data?: TableData;
	public readonly info?: { [key: string]: string };
	public readonly items: { [key: string]: Item<ItemData> };
	public readonly tableScript?: string;
	private events?: EventProxy;
	private api?: TableApi;

	private readonly textureCache: Map<string, any> = new Map();

	public readonly textures: { [key: string]: Texture } = {};
	public readonly collections: { [key: string]: Collection } = {};

	public readonly bumpers: { [key: string]: Bumper } = {};
	public readonly flippers: { [key: string]: Flipper } = {};
	public readonly flashers: { [key: string]: Flasher } = {};
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
	public readonly textboxes: { [key: string]: Textbox } = {};
	public readonly timers: { [key: string]: Timer } = {};
	public readonly triggers: { [key: string]: Trigger } = {};

	private readonly meshGenerator?: TableMeshGenerator;
	private readonly hitGenerator?: TableHitGenerator;

	private readonly loader: TableLoader;

	public static playfieldThickness = 20.0;

	public static async load(reader: IBinaryReader, opts?: TableLoadOptions): Promise<Table> {
		opts = opts || defaultTableLoadOptions;
		const tableLoader = new TableLoader();
		return new Table(tableLoader, await tableLoader.load(reader, opts));
	}

	private constructor(loader: TableLoader, loadedTable: LoadedTable) {
		this.loader = loader;
		this.items = loadedTable.items;
		if (loadedTable.data) {
			this.data = loadedTable.data;
			this.meshGenerator = new TableMeshGenerator(this);
			this.hitGenerator = new TableHitGenerator(loadedTable.data);
		}
		if (loadedTable.info) {
			this.info = loadedTable.info;
		}
		if (loadedTable.tableScript) {
			this.tableScript = loadedTable.tableScript;
		}
		const mapping: Array<[any, any]> = [
			[loadedTable.textures, this.textures],
			[loadedTable.collections, this.collections],
			[loadedTable.bumpers, this.bumpers],
			[loadedTable.flippers, this.flippers],
			[loadedTable.flashers, this.flashers],
			[loadedTable.gates, this.gates],
			[loadedTable.hitTargets, this.hitTargets],
			[loadedTable.kickers, this.kickers],
			[loadedTable.lights, this.lights],
			[loadedTable.plungers, this.plungers],
			[loadedTable.primitives, this.primitives],
			[loadedTable.ramps, this.ramps],
			[loadedTable.rubbers, this.rubbers],
			[loadedTable.spinners, this.spinners],
			[loadedTable.surfaces, this.surfaces],
			[loadedTable.textBoxes, this.textboxes],
			[loadedTable.timers, this.timers],
			[loadedTable.triggers, this.triggers],
		];
		for (const m of mapping) {
			if (isLoaded(m[0])) {
				for (const item of m[0]) {
					m[1][item.getName()] = item;
				}
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
		return this.data.materials.find(m => m.name === name);
	}

	public getApi(): TableApi {
		return this.api!;
	}

	public getEventNames(): string[] {
		return [ 'Exit', 'Init', 'KeyDown', 'KeyUp', 'MusicDone', 'Paused', 'UnPaused' ];
	}

	public setupPlayer(player: Player, table: Table): void {
		this.events = new EventProxy(this);
		this.api = new TableApi(this.data!, this.events, player, this);
	}

	public getBoundingBox(): FRect3D {
		return new FRect3D(this.data!.left, this.data!.right, this.data!.top, this.data!.bottom, this.getTableHeight(), this.data!.glassHeight);
	}

	public getPlayables(): IPlayable[] {
		const playableItems = this.getItems().filter(isPlayable) as unknown as IPlayable[];
		return [ this, ...playableItems ];
	}

	public getMovables(): Array<IMovable<ItemState>> {
		return this.getItems().filter(isMovable) as unknown as Array<IMovable<ItemState>>;
	}

	public getAnimatables(): Array<IAnimatable<ItemState>> {
		return this.getItems().filter(isAnimatable) as unknown as  Array<IAnimatable<ItemState>>;
	}

	public getScriptables(): Array<IScriptable<any>> {
		const scriptableItems = this.getItems().filter(isScriptable) as unknown as Array<IScriptable<any>>;
		return [ this, ...scriptableItems ];
	}

	public getHittables(): IHittable[] {
		return this.getItems().filter(isHittable) as unknown as IHittable[];
	}

	public getHitShapes(): HitObject[] {
		return this.hitGenerator!.generateHitObjects();
	}

	public generatePlayfieldHit() {
		return new HitPlane(new Vertex3D(0, 0, 1), this.data!.tableHeight)
			.setFriction(this.data!.getFriction())
			.setElasticity(this.data!.getElasticity(), this.data!.getElasticityFalloff())
			.setScatter(degToRad(this.data!.getScatter()));
	}

	public generateGlassHit() {
		return new HitPlane(new Vertex3D(0, 0, -1), this.data!.glassHeight)
			.setElasticity(0.2);
	}

	public getElementApis(): { [key: string]: any } {
		const apis: { [key: string]: any } = {};
		const elements = this.getScriptables();
		for (const element of elements) {
			apis[element.getName()] = element.getApi();
		}
		return apis;
	}

	public getElements(): { [key: string]: IScriptable<any> } {
		const elements: { [key: string]: any } = {};
		const elementList = this.getScriptables();
		for (const element of elementList) {
			elements[element.getName()] = element;
		}
		return elements;
	}

	public getScaleZ(): number {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		return f4(this.data.bgScaleZ[this.data.bgCurrentSet]) || 1.0;
	}

	public getDetailLevel() {
		return 10; // todo check if true
	}

	public getGlobalDifficulty(): number {
		return this.data!.globalDifficulty!;
	}

	public getTableHeight() {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		return this.data.tableHeight;
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
			return this.data.tableHeight;
		}

		if (this.surfaces[surface]) {
			return f4(this.data.tableHeight + this.surfaces[surface].heightTop);
		}

		if (this.ramps[surface]) {
			return f4(this.data.tableHeight + this.ramps[surface].getSurfaceHeight(x, y, this));
		}

		/* istanbul ignore next */
		logger().warn('[Table.getSurfaceHeight] Unknown surface %s.', surface);
		return this.data.tableHeight;
	}

	// public async exportGltf(opts?: TableExportOptions): Promise<string> {
	// 	const exporter = new TableExporter(this, opts || {});
	// 	return await exporter.exportGltf();
	// }

	// public async exportGlb(opts?: TableExportOptions): Promise<Buffer> {
	// 	const exporter = new TableExporter(new ThreeRenderApi(), this, opts || {});
	// 	return await exporter.exportGlb();
	// }

	public async streamStorage<T>(name: string, streamer: (stg: Storage) => Promise<T>): Promise<T> {
		return this.loader.streamStorage(name, streamer);
	}

	public getTableScript(): string {
		/* istanbul ignore if */
		if (!this.tableScript) {
			throw new Error('Table script is not loaded. Load table with loadTableScript = true.');
		}
		return this.tableScript;
	}

	public isVisible(): boolean {
		return true;
	}

	public getMeshes<NODE, GEOMETRY, POINT_LIGHT>(table: Table, renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, opts: TableExportOptions): Meshes<GEOMETRY> {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		const geometry = this.meshGenerator!.getPlayfieldMesh(renderApi, opts);
		return {
			playfield: {
				geometry,
				material: this.getMaterial(this.data.szPlayfieldMaterial),
				map: this.getTexture(this.data.szImage),
			},
		};
	}

	/**
	 * Generates the top-most node for the render engine that contains the entire table.
	 *
	 * @param renderApi Render API
	 * @param opts Which elements to generate
	 */
	public async generateTableNode<NODE, GEOMETRY, POINT_LIGHT>(renderApi: IRenderApi<NODE, GEOMETRY, POINT_LIGHT>, opts: TableExportOptions = {}): Promise<NODE> {
		return await this.meshGenerator!.generateTableNode(renderApi, opts);
	}

	public prepareToPlay() {
		for (const primitive of Object.values<Primitive>(this.primitives)) {
			primitive.clearMesh();
		}
	}

	public runTableScript() {
		if (!this.tableScript) {
			logger().warn('Table script is not loaded!');
			return;
		}
		const transpiler = new Transpiler(this);
		transpiler.execute(this.tableScript);
		logger().info('Table script loaded, transpiled and executed.');
	}

	public broadcastInit() {
		for (const hittable of this.getHittables()) {
			hittable.getEventProxy().fireVoidEvent(Event.GameEventsInit);
		}
	}

	public getTextureFromCache<TEXTURE>(name: string): TEXTURE | null {
		return this.textureCache.get(name);
	}

	public addTextureToCache<TEXTURE>(name: string, image: TEXTURE) {
		this.textureCache.set(name, image);
	}

	public clearTextureCache() {
		this.textureCache.clear();
	}

	public setupCollections() {
		for (const collection of Object.values(this.collections)) {
			for (const itemName of collection.getItemNames()) {
				const tableItem = this.items[itemName];
				if (!tableItem) {
					logger().warn('Non-existent item "%s" in collection "%s", skipping.', itemName, collection.getName());
					break;
				}
				if (isScriptable(tableItem)) {
					tableItem.getApi()._addCollection(collection, collection.items.length);
					collection.items.push(tableItem);
				}
			}
		}
	}

	public getItems(): Array<Item<ItemData>> {
		return Object.values(this.items);
	}

}

function isLoaded(items: any[] | undefined) {
	return items && items.length > 0;
}

const defaultTableLoadOptions: TableLoadOptions = {
	tableDataOnly: false,
	tableInfoOnly: false,
	loadInvisibleItems: true,
	loadTableScript: true,
};

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

	/**
	 * If set, table script is read
	 */
	loadTableScript?: boolean;

	/**
	 * If set, skips reading primitive mesh data.
	 */
	skipMeshes?: boolean;
}

export interface TableGenerateOptions {
	exportPlayfield?: boolean;
	exportPrimitives?: boolean;
	exportRubbers?: boolean;
	exportSurfaces?: boolean;
	exportFlippers?: boolean;
	exportBumpers?: boolean;
	exportRamps?: boolean;
	exportLightBulbs?: boolean;
	exportPlayfieldLights?: boolean;
	exportLightBulbLights?: boolean;
	exportHitTargets?: boolean;
	exportGates?: boolean;
	exportKickers?: boolean;
	exportTriggers?: boolean;
	exportSpinners?: boolean;
	exportPlungers?: boolean;
	gltfOptions?: TableGenerateGltfOptions;
}

export interface TableGenerateGltfOptions {
	binary?: boolean;
	optimizeImages?: boolean;
	trs?: boolean;
	onlyVisible?: boolean;
	truncateDrawRange?: boolean;
	embedImages?: boolean;
	animations?: any[];
	forceIndices?: boolean;
	forcePowerOfTwoTextures?: boolean;
	compressVertices?: boolean;
	versionString?: string;
	dracoOptions?: {
		compressionLevel?: number;
		quantizePosition?: number;
		quantizeNormal?: number;
		quantizeTexcoord?: number;
		quantizeColor?: number;
		quantizeSkin?: number;
		unifiedQuantization?: boolean;
	};
}
