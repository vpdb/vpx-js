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

import { IBinaryReader, OleCompoundDoc, Storage } from '../../io/ole-doc';
import { logger } from '../../util/logger';
import { Bumper } from '../bumper/bumper';
import { Collection } from '../collection/collection';
import { ItemType } from '../enums';
import { Flasher } from '../flasher/flasher';
import { Flipper } from '../flipper/flipper';
import { Gate } from '../gate/gate';
import { HitTarget } from '../hit-target/hit-target';
import { Item } from '../item';
import { ItemData } from '../item-data';
import { Kicker } from '../kicker/kicker';
import { Light } from '../light/light';
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
import { TableLoadOptions } from './table';
import { TableData } from './table-data';
import { Decal } from '../decal/decal';
import { LightSeq } from '../lightseq/lightseq';
import { DispReel } from '../dispreel/dispreel';

export class TableLoader {

	private doc!: OleCompoundDoc;

	public async load(reader: IBinaryReader, opts: TableLoadOptions = {}): Promise<LoadedTable> {
		const then = Date.now();
		this.doc = await OleCompoundDoc.load(reader);
		try {

			const loadedTable: LoadedTable = { items: {} };
			if (opts.loadTableScript || (opts.tableDataOnly || !opts.tableInfoOnly)) {

				// open game storage
				const gameStorage = this.doc.storage('GameStg');

				// load table data
				loadedTable.data = await TableData.fromStorage(gameStorage, 'GameData');

				if (!opts.tableDataOnly) {

					// load items
					await this.loadGameItems(loadedTable, gameStorage, loadedTable.data.numGameItems, opts);

					// load images
					await this.loadTextures(loadedTable, gameStorage, loadedTable.data.numTextures);

					// load collections
					await this.loadCollections(loadedTable, gameStorage, loadedTable.data.numCollections);
				}

				if (opts.loadTableScript) {
					const script = await gameStorage.read('GameData', loadedTable.data.scriptPos, loadedTable.data.scriptLen);
					loadedTable.tableScript = script.toString();
					if (loadedTable.tableScript.endsWith('ENDB')) { // when the script is empty, the counter seems to be wrong, so cut.
						loadedTable.tableScript = loadedTable.tableScript.substr(0, loadedTable.tableScript.length - 8);
					}
				}
			}

			if (opts.tableInfoOnly || !opts.tableDataOnly) {
				await this.loadTableInfo(loadedTable);
			}

			logger().info('[Table.load] Table loaded in %sms.', Date.now() - then);

			return loadedTable;

		} finally {
			await this.doc.close();
		}
	}

	public async streamStorage<T>(name: string, streamer: (stg: Storage) => Promise<T>): Promise<T> {
		try {
			await this.doc.reopen();
			return await streamer(this.doc.storage(name));
		} finally {
			await this.doc.close();
		}
	}

	private async loadGameItems(loadedTable: LoadedTable, storage: Storage, numItems: number, opts: TableLoadOptions): Promise<{[key: string]: number}> {
		const stats: {[key: string]: number} = {};

		// init arrays
		loadedTable.surfaces = [];
		loadedTable.primitives = [];
		loadedTable.lights = [];
		loadedTable.rubbers = [];
		loadedTable.flippers = [];
		loadedTable.flashers = [];
		loadedTable.bumpers = [];
		loadedTable.ramps = [];
		loadedTable.hitTargets = [];
		loadedTable.gates = [];
		loadedTable.kickers = [];
		loadedTable.triggers = [];
		loadedTable.spinners = [];
		loadedTable.timers = [];
		loadedTable.plungers = [];
		loadedTable.textBoxes = [];
		loadedTable.decals = [];
		loadedTable.lightSeqs = [];
		loadedTable.dispReels = [];

		// go through all game items
		for (let i = 0; i < numItems; i++) {
			const itemName = `GameItem${i}`;
			const itemData = await storage.read(itemName, 0, 4);
			const itemType = itemData.readInt32LE(0);
			const item = await this.loadItem(loadedTable, storage, itemName, itemType, opts);
			if (item) {
				loadedTable.items[item.getName()] = item;
			}
			if (!stats[ItemData.getType(itemType)]) {
				stats[ItemData.getType(itemType)] = 1;
			} else {
				stats[ItemData.getType(itemType)]++;
			}
		}
		return stats;
	}

	private async loadItem(loadedTable: LoadedTable, storage: Storage, itemName: string, itemType: number, opts: TableLoadOptions): Promise<Item<ItemData> | null> {
		switch (itemType) {

			case ItemType.Surface: {
				const item = await Surface.fromStorage(storage, itemName);
				loadedTable.surfaces!.push(item);
				return item;
			}

			case ItemType.Primitive: {
				const item = await Primitive.fromStorage(storage, itemName, opts.skipMeshes === true);
				loadedTable.primitives!.push(item);
				return item;
			}

			case ItemType.Light: {
				const item = await Light.fromStorage(storage, itemName);
				loadedTable.lights!.push(item);
				return item;
			}

			case ItemType.Rubber: {
				const item = await Rubber.fromStorage(storage, itemName);
				loadedTable.rubbers!.push(item);
				return item;
			}

			case ItemType.Flasher: {
				const item = await Flasher.fromStorage(storage, itemName);
				loadedTable.flashers!.push(item);
				return item;
			}

			case ItemType.Flipper: {
				const item = await Flipper.fromStorage(storage, itemName);
				loadedTable.flippers!.push(item);
				return item;
			}

			case ItemType.Bumper: {
				const item = await Bumper.fromStorage(storage, itemName);
				loadedTable.bumpers!.push(item);
				return item;
			}

			case ItemType.Ramp: {
				const item = await Ramp.fromStorage(storage, itemName);
				loadedTable.ramps!.push(item);
				return item;
			}

			case ItemType.HitTarget: {
				const item = await HitTarget.fromStorage(storage, itemName);
				loadedTable.hitTargets!.push(item);
				return item;
			}

			case ItemType.Gate: {
				const item = await Gate.fromStorage(storage, itemName);
				loadedTable.gates!.push(item);
				return item;
			}

			case ItemType.Kicker: {
				const item = await Kicker.fromStorage(storage, itemName);
				loadedTable.kickers!.push(item);
				return item;
			}

			case ItemType.Trigger: {
				const item = await Trigger.fromStorage(storage, itemName);
				loadedTable.triggers!.push(item);
				return item;
			}

			case ItemType.Spinner: {
				const item = await Spinner.fromStorage(storage, itemName);
				loadedTable.spinners!.push(item);
				return item;
			}

			case ItemType.Timer: {
				const item = await Timer.fromStorage(storage, itemName);
				if (opts.loadInvisibleItems) {
					loadedTable.timers!.push(item);
				}
				return item;
			}

			case ItemType.Plunger: {
				const item = await Plunger.fromStorage(storage, itemName);
				loadedTable.plungers!.push(item);
				return item;
			}

			case ItemType.Textbox: {
				const item = await Textbox.fromStorage(storage, itemName);
				if (opts.loadInvisibleItems) {
					loadedTable.textBoxes!.push(item);
				}
				return item;
			}

			case ItemType.Decal: {
				const item = await Decal.fromStorage(storage, itemName);
				loadedTable.decals!.push(item);
				return item;
			}

			case ItemType.LightSeq: {
				const item = await LightSeq.fromStorage(storage, itemName);
				loadedTable.lightSeqs!.push(item);
				return item;
			}

			case ItemType.DispReel: {
				const item = await DispReel.fromStorage(storage, itemName);
				loadedTable.dispReels!.push(item);
				return item;
			}

			default:
				// ignore the rest for now
				return null;
		}
	}

	private async loadTextures(loadedTable: LoadedTable, storage: Storage, numItems: number): Promise<void> {
		loadedTable.textures = [];
		for (let i = 0; i < numItems; i++) {
			const itemName = `Image${i}`;
			const texture = await Texture.fromStorage(storage, itemName);
			loadedTable.textures.push(texture);
		}
	}

	private async loadTableInfo(loadedTable: LoadedTable) {
		const tableInfoStorage = this.doc.storage('TableInfo');
		loadedTable.info = {};
		for (const key of tableInfoStorage.getStreams()) {
			const data = await tableInfoStorage.read(key);
			if (data) {
				loadedTable.info[key] = data.toString().replace(/\0/g, '');
			}
		}
	}

	private async loadCollections(loadedTable: LoadedTable, storage: Storage, numItems: number) {
		loadedTable.collections = [];
		for (let i = 0; i < numItems; i++) {
			const itemName = `Collection${i}`;
			const collection = await Collection.fromStorage(storage, itemName);
			loadedTable.collections.push(collection);
			loadedTable.items[collection.getName()] = collection;
		}
	}
}

export interface LoadedTable {
	data?: TableData;
	info?: { [key: string]: string };
	items: { [key: string]: Item<ItemData> };

	tableScript?: string;
	textures?: Texture[];
	collections?: Collection[];

	surfaces?: Surface[];
	primitives?: Primitive[];
	rubbers?: Rubber[];
	flippers?: Flipper[];
	flashers?: Flasher[];
	bumpers?: Bumper[];
	ramps?: Ramp[];
	lights?: Light[];
	hitTargets?: HitTarget[];
	gates?: Gate[];
	kickers?: Kicker[];
	triggers?: Trigger[];
	spinners?: Spinner[];
	plungers?: Plunger[];
	textBoxes?: Textbox[];
	decals?: Decal[];
	lightSeqs?: LightSeq[];
	dispReels?: DispReel[];
	timers?: Timer[];
}
