/* tslint:disable: no-bitwise */
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

import { BufferGeometry, ExtrudeBufferGeometry, Scene, Shape, Vector2 } from 'three';
import { OleCompoundDoc, Storage } from '..';
import { IHittable } from '../game/ihittable';
import { IMovable } from '../game/imovable';
import { IPlayable } from '../game/iplayable';
import { IRenderable } from '../game/irenderable';
import { TableExporter, VpTableExporterOptions } from '../gltf/table-exporter';
import { IBinaryReader } from '../io/ole-doc';
import { f4 } from '../math/float';
import { FRect3D } from '../math/frect3d';
import { Vertex3DNoTex2 } from '../math/vertex';
import { logger } from '../util/logger';
import { Bumper } from './bumper/bumper';
import { Flipper } from './flipper/flipper';
import { Gate } from './gate/gate';
import { HitTarget } from './hit-target/hit-target';
import { ItemData, Meshes } from './item-data';
import { Kicker } from './kicker/kicker';
import { LightItem } from './light-item';
import { Material } from './material';
import { Mesh } from './mesh';
import { Plunger } from './plunger/plunger';
import { Primitive } from './primitive/primitive';
import { Ramp } from './ramp/ramp';
import { Rubber } from './rubber/rubber';
import { Spinner } from './spinner/spinner';
import { Surface } from './surface/surface';
import { TableData } from './table-data';
import { TextBoxItem } from './textbox-item';
import { Texture } from './texture';
import { TimerItem } from './timer-item';
import { Trigger } from './trigger/trigger';

/**
 * A Visual Pinball table.
 *
 * This holds together all table elements of a .vpt/.vpx file. It's also
 * the entry point for parsing the file.
 */
export class Table implements IRenderable {

	public data?: TableData;

	public tableInfo: { [key: string]: string } = {};
	public surfaces: { [key: string]: Surface } = {};
	public primitives: { [key: string]: Primitive } = {};
	public textures: { [key: string]: Texture } = {};
	public rubbers: { [key: string]: Rubber } = {};
	public flippers: { [key: string]: Flipper } = {};
	public bumpers: { [key: string]: Bumper } = {};
	public ramps: { [key: string]: Ramp } = {};
	public lights: LightItem[] = [];
	public hitTargets: HitTarget[] = [];
	public gates: Gate[] = [];
	public kickers: Kicker[] = [];
	public triggers: Trigger[] = [];
	public spinners: Spinner[] = [];
	public timers: TimerItem[] = [];
	public plungers: Plunger[] = [];
	public textBoxes: TextBoxItem[] = [];

	public static playfieldThickness = 20.0;

	private doc!: OleCompoundDoc;

	public static async load(reader: IBinaryReader, opts?: TableLoadOptions): Promise<Table> {
		const then = Date.now();
		const vpTable = new Table();
		await vpTable._load(reader, opts || {});
		logger().info('[Table.load] Table loaded in %sms.', Date.now() - then);
		return vpTable;
	}

	public static fromSerialized(blob: { [key: string]: any }): Table {
		const table = new Table();
		table.data = TableData.fromSerialized(blob.data);
		for (const name of Object.keys(blob.flippers)) {
			table.flippers[name] = Flipper.fromSerialized(blob.flippers[name].data.itemName, blob.flippers[name]);
		}
		return table;
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
		return [ ...Object.values(this.flippers), ...this.plungers ];
	}

	public getMovables(): Array<IMovable<any>> {
		return [ ...Object.values(this.flippers), ...this.plungers ];
	}

	public getHittables(): IHittable[] {
		return [
			...Object.values(this.flippers),
			...Object.values(this.surfaces),
			...Object.values(this.rubbers),
			...this.plungers,
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

	public async streamStorage<T>(name: string, streamer: (stg: Storage) => Promise<T>): Promise<T> {
		try {
			await this.doc.reopen();
			return await streamer(this.doc.storage(name));
		} finally {
			await this.doc.close();
		}
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

	public async getTableScript(): Promise<string> {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		await this.doc.reopen();
		try {
			const gameStorage = this.doc.storage('GameStg');
			const buffer = await gameStorage.read('GameData', this.data.scriptPos, this.data.scriptLen);
			return buffer.toString();
		} finally {
			await this.doc.close();
		}
	}

	private async _load(reader: IBinaryReader, opts: TableLoadOptions): Promise<void> {

		this.doc = await OleCompoundDoc.load(reader);
		try {

			if (opts.tableDataOnly || !opts.tableInfoOnly) {
				// open game storage
				const gameStorage = this.doc.storage('GameStg');

				// load game data
				this.data = await TableData.fromStorage(gameStorage, 'GameData');

				if (!opts.tableDataOnly) {

					// load items
					await this.loadGameItems(gameStorage, this.data.numGameItems, opts);

					// load images
					await this.loadTextures(gameStorage, this.data.numTextures);
				}
			}

			if (opts.tableInfoOnly || !opts.tableDataOnly) {
				await this.loadTableInfo();
			}

		} finally {
			await this.doc.close();
		}
	}

	public getMeshes(table: Table, opts: VpTableExporterOptions): Meshes {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		let geometry: BufferGeometry;
		const dim = table.getDimensions();

		const pfShape = new Shape();
		pfShape.moveTo(this.data.left, this.data.top);
		pfShape.lineTo(this.data.right, this.data.top);
		pfShape.lineTo(this.data.right, this.data.bottom);
		pfShape.lineTo(this.data.left, this.data.bottom);
		pfShape.lineTo(this.data.left, this.data.top);

		// drill holes if playfield lights are rendered separately.
		if (opts.exportPlayfieldLights) {
			pfShape.holes = this.lights
				.filter(l => l.isPlayfieldLight(table))
				.map(l => l.getPath(table));
		}

		const invTableWidth = 1.0 / dim.width;
		const invTableHeight = 1.0 / dim.height;

		geometry = new ExtrudeBufferGeometry(pfShape, {
			depth: Table.playfieldThickness,
			bevelEnabled: false,
			steps: 1,
			UVGenerator: {
				generateSideWallUV(g: ExtrudeBufferGeometry, vertices: number[], indexA: number, indexB: number, indexC: number, indexD: number): Vector2[] {
					return [
						new Vector2(0, 0),
						new Vector2(0, 0),
						new Vector2(0, 0),
						new Vector2(0, 0),
					];
				},
				generateTopUV(g: ExtrudeBufferGeometry, vertices: number[], indexA: number, indexB: number, indexC: number): Vector2[] {
					const ax = vertices[indexA * 3];
					const ay = vertices[indexA * 3 + 1];
					const bx = vertices[indexB * 3];
					const by = vertices[indexB * 3 + 1];
					const cx = vertices[indexC * 3];
					const cy = vertices[indexC * 3 + 1];
					return [
						new Vector2(ax * invTableWidth, 1 - ay * invTableHeight),
						new Vector2(bx * invTableWidth, 1 - by * invTableHeight),
						new Vector2(cx * invTableWidth, 1 - cy * invTableHeight),
					];
				},
			},
		});

		return {
			playfield: {
				geometry,
				material: this.getMaterial(this.data.szPlayfieldMaterial),
				map: this.getTexture(this.data.szImage),
			},
		};
	}

	public isVisible(): boolean {
		return true;
	}

	private async loadGameItems(storage: Storage, numItems: number, opts: TableLoadOptions): Promise<{[key: string]: number}> {
		const stats: {[key: string]: number} = {};
		for (let i = 0; i < numItems; i++) {
			const itemName = `GameItem${i}`;
			const itemData = await storage.read(itemName, 0, 4);
			const itemType = itemData.readInt32LE(0);
			switch (itemType) {

				case ItemData.TypeSurface: {
					const item = await Surface.fromStorage(storage, itemName);
					this.surfaces[item.getName()] = item;
					break;
				}

				case ItemData.TypePrimitive: {
					const item = await Primitive.fromStorage(storage, itemName);
					this.primitives[item.getName()] = item;
					break;
				}

				case ItemData.TypeLight: {
					this.lights.push(await LightItem.fromStorage(storage, itemName));
					break;
				}

				case ItemData.TypeRubber: {
					const item = await Rubber.fromStorage(storage, itemName);
					this.rubbers[item.getName()] = item;
					break;
				}

				case ItemData.TypeFlipper: {
					const item = await Flipper.fromStorage(storage, itemName);
					this.flippers[item.getName()] = item;
					break;
				}

				case ItemData.TypeBumper: {
					const item = await Bumper.fromStorage(storage, itemName);
					this.bumpers[item.getName()] = item;
					break;
				}

				case ItemData.TypeRamp: {
					const item = await Ramp.fromStorage(storage, itemName);
					this.ramps[item.getName()] = item;
					break;
				}

				case ItemData.TypeHitTarget: {
					this.hitTargets.push(await HitTarget.fromStorage(storage, itemName));
					break;
				}

				case ItemData.TypeGate: {
					this.gates.push(await Gate.fromStorage(storage, itemName));
					break;
				}

				case ItemData.TypeKicker: {
					this.kickers.push(await Kicker.fromStorage(storage, itemName));
					break;
				}

				case ItemData.TypeTrigger: {
					this.triggers.push(await Trigger.fromStorage(storage, itemName));
					break;
				}

				case ItemData.TypeSpinner: {
					this.spinners.push(await Spinner.fromStorage(storage, itemName));
					break;
				}

				case ItemData.TypeTimer: {
					if (opts.loadInvisibleItems) {
						this.timers.push(await TimerItem.fromStorage(storage, itemName));
					}
					break;
				}

				case ItemData.TypePlunger: {
					const item = await Plunger.fromStorage(storage, itemName, this);
					this.plungers.push(item);
					break;
				}

				case ItemData.TypeTextbox: {
					if (opts.loadInvisibleItems) {
						this.textBoxes.push(await TextBoxItem.fromStorage(storage, itemName));
					}
					break;
				}

				default:
					// ignore the rest for now
					break;
			}
			if (!stats[ItemData.getType(itemType)]) {
				stats[ItemData.getType(itemType)] = 1;
			} else {
				stats[ItemData.getType(itemType)]++;
			}
		}
		return stats;
	}

	private async loadTextures(storage: Storage, numItems: number): Promise<void> {
		for (let i = 0; i < numItems; i++) {
			const itemName = `Image${i}`;
			const texture = await Texture.fromStorage(storage, itemName);
			this.textures[texture.getName()] = texture;
		}
	}

	private async loadTableInfo() {
		const tableInfoStorage = this.doc.storage('TableInfo');
		for (const key of tableInfoStorage.getStreams()) {
			const data = await tableInfoStorage.read(key);
			if (data) {
				this.tableInfo[key] = data.toString().replace(/\0/g, '');
			}
		}
	}

	/* istanbul ignore next */
	private get2DMesh(): Mesh {
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		const rgv: Vertex3DNoTex2[] = [];
		for (let i = 0; i < 7; i++) {
			rgv.push(new Vertex3DNoTex2());
		}
		rgv[0].x = this.data.left;     rgv[0].y = this.data.top;      rgv[0].z = this.data.tableheight;
		rgv[1].x = this.data.right;    rgv[1].y = this.data.top;      rgv[1].z = this.data.tableheight;
		rgv[2].x = this.data.right;    rgv[2].y = this.data.bottom;   rgv[2].z = this.data.tableheight;
		rgv[3].x = this.data.left;     rgv[3].y = this.data.bottom;   rgv[3].z = this.data.tableheight;

		// These next 4 vertices are used just to set the extents
		rgv[4].x = this.data.left;     rgv[4].y = this.data.top;      rgv[4].z = this.data.tableheight + Table.playfieldThickness;
		rgv[5].x = this.data.left;     rgv[5].y = this.data.bottom;   rgv[5].z = this.data.tableheight + Table.playfieldThickness;
		rgv[6].x = this.data.right;    rgv[6].y = this.data.bottom;   rgv[6].z = this.data.tableheight + Table.playfieldThickness;
		//rgv[7].x=g_pplayer->m_ptable->m_right;    rgv[7].y=g_pplayer->m_ptable->m_top;      rgv[7].z=50.0f;

		for (let i = 0; i < 4; ++i) {
			rgv[i].nx = 0;
			rgv[i].ny = 0;
			rgv[i].nz = 1.0;

			rgv[i].tv = (i & 2) ? 1.0 : 0.0;
			rgv[i].tu = (i === 1 || i === 2) ? 1.0 : 0.0;
		}

		const playfieldPolyIndices = [ 0, 1, 3, 0, 3, 2, 2, 3, 5, 6 ];
		Mesh.setNormal(rgv, playfieldPolyIndices.splice(6), 4);

		const buffer: Vertex3DNoTex2[] = [];
		for (let i = 0; i < 7; i++) {
			buffer.push(new Vertex3DNoTex2());
		}
		let offs = 0;
		for (let y = 0; y <= 1; ++y) {
			for (let x = 0; x <= 1; ++x) {
				buffer[offs].x = (x & 1) ? rgv[1].x : rgv[0].x;
				buffer[offs].y = (y & 1) ? rgv[2].y : rgv[0].y;
				buffer[offs].z = rgv[0].z;

				buffer[offs].tu = (x & 1) ? rgv[1].tu : rgv[0].tu;
				buffer[offs].tv = (y & 1) ? rgv[2].tv : rgv[0].tv;

				buffer[offs].nx = rgv[0].nx;
				buffer[offs].ny = rgv[0].ny;
				buffer[offs].nz = rgv[0].nz;
				++offs;
			}
		}
		return new Mesh(buffer, playfieldPolyIndices);
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
