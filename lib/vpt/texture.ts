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

import { basename } from 'path';
import { LzwReader } from '../gltf/lzw-reader';
import { BiffParser } from '../io/biff-parser';
import { Storage } from '../io/ole-doc';
import { ITextureLoader } from '../render/irender-api';
import { logger } from '../util/logger';
import { Binary } from './binary';
import { Table } from './table/table';

/**
 * VPinball's texture.
 *
 * These are read from the "Image*" storage items.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/Texture.cpp
 */
export class Texture extends BiffParser {

	public localFileName?: string; // either localPath or storageName is set
	public storageName?: string;

	public szName!: string;
	public szInternalName!: string;
	public szPath?: string;
	public width!: number;
	public height!: number;
	public alphaTestValue?: number;
	public binary?: Binary;
	public pdsBuffer?: BaseTexture;
	private rgbTransparent: number = 0xffffff;

	private constructor() {
		super();
	}

	public static async fromStorage(storage: Storage, itemName: string): Promise<Texture> {
		const texture = new Texture();
		texture.storageName = itemName;
		await storage.streamFiltered(itemName, 0, Texture.createStreamHandler(storage, itemName, texture));
		return texture;
	}

	public static fromFilesystem(resFileName: string): Texture {
		const texture = new Texture();
		texture.localFileName = resFileName;
		return texture;
	}

	private static createStreamHandler(storage: Storage, itemName: string, texture: Texture) {
		texture.binary = new Binary();
		return BiffParser.stream((buffer, tag, offset, len) => texture.fromTag(buffer, tag, offset, len, storage, itemName), {
			nestedTags: {
				JPEG: {
					onStart: () => new Binary(),
					onTag: binary => binary.fromTag.bind(binary),
					onEnd: binary => texture.binary = binary,
				},
			},
		});
	}

	public getName(): string {
		return this.localFileName ? basename(this.localFileName) : this.szInternalName.toLowerCase();
	}

	/**
	 * Loads the texture for the given renderer.
	 * @param table
	 * @param loader
	 */
	public async loadTexture<TEXTURE>(loader: ITextureLoader<TEXTURE>, table: Table): Promise<TEXTURE> {

		let texture = table.getTextureFromCache<TEXTURE>(this.getName());
		if (texture) {
			return texture;
		}

		if (this.isRaw()) {
			texture = await loader.loadRawTexture(this.getName(), this.pdsBuffer!.getData(), this.width, this.height);

		} else if (this.localFileName) {
			texture = await loader.loadDefaultTexture(this.getName(), this.localFileName);

		} else {
			const data = await table.streamStorage<Buffer>('GameStg', storage => this.streamImage(storage, this.storageName, this.binary));
			if (!data || !data.length) {
				throw new Error(`Cannot load image data for texture ${this.getName()}`);
			}
			texture = await loader.loadTexture(this.getName(), data);
		}
		table.addTextureToCache(this.getName(), texture);
		return texture;
	}

	public isRaw(): boolean {
		return this.pdsBuffer !== undefined;
	}

	public isHdr() {
		return this.pdsBuffer && this.pdsBuffer.format === BaseTexture.RGB_FP;
	}

	private async streamImage(storage: Storage, storageName?: string, binary?: Binary): Promise<Buffer> {
		const strm = storage.stream(storageName!, binary!.pos, binary!.len);
		return new Promise<Buffer>((resolve, reject) => {
			const bufs: Buffer[] = [];
			/* istanbul ignore if */
			if (!strm) {
				return reject(new Error('No such stream "' + storageName + '".'));
			}
			strm.on('error', reject);
			strm.on('data', (buf: Buffer) => bufs.push(buf));
			strm.on('end', () => resolve(Buffer.concat(bufs)));
		});
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number, storage: Storage, itemName: string): Promise<number> {
		switch (tag) {
			case 'NAME': this.szName = this.getString(buffer, len); break;
			case 'INME': this.szInternalName = this.getString(buffer, len); break;
			case 'PATH': this.szPath = this.getString(buffer, len); break;
			case 'WDTH': this.width = this.getInt(buffer); break;
			case 'HGHT': this.height = this.getInt(buffer); break;
			case 'ALTV': this.alphaTestValue = this.getFloat(buffer); break;
			case 'BITS':
				let compressedLen: number;
				[ this.pdsBuffer, compressedLen ] = await BaseTexture.get(storage, itemName, offset, this.width, this.height);
				return compressedLen + 4;

			/* istanbul ignore next: duh. */
			case 'LINK': logger().warn('[Texture.fromTag] Ignoring LINK tag for %s at %s, implement when understood what it is.', this.szName, this.storageName); break;

			/* istanbul ignore next: legacy vp9 */
			case 'TRNS': this.rgbTransparent = this.getInt(buffer); break;

			/* istanbul ignore next */
			default: logger().warn('[Texture.fromTag] Unknown tag "%s".', tag);
		}
		return 0;
	}
}

class BaseTexture {

	public static readonly RGBA = 0;
	public static readonly RGB_FP = 1;

	private width: number;
	private height: number;
	public format: number = BaseTexture.RGBA;
	private data!: Buffer;

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
	}

	public getData(): Buffer {
		return this.data;
	}

	public static async get(storage: Storage, itemName: string, pos: number, width: number, height: number): Promise<[BaseTexture, number]> {
		const pdsBuffer = new BaseTexture(width, height);
		const compressed = await storage.read(itemName, pos);

		const lzw = new LzwReader(compressed, width * 4, height, pdsBuffer.pitch());
		let compressedLen: number;
		[ pdsBuffer.data, compressedLen ] = lzw.decompress();

		const lpitch = pdsBuffer.pitch();

		// Assume our 32 bit color structure
		// Find out if all alpha values are zero
		const pch = pdsBuffer.data;
		let allAlphaZero = true;
		loop: for (let i = 0; i < height; i++) {
			for (let l = 0; l < width; l++) {
				if (pch[i * lpitch + 4 * l + 3] !== 0) {
					allAlphaZero = false;
					break loop;
				}
			}
		}

		// all alpha values are 0: set them all to 0xff
		if (allAlphaZero) {
			for (let i = 0; i < height; i++) {
				for (let l = 0; l < width; l++) {
					pch[i * lpitch + 4 * l + 3] = 0xff;
				}
			}
		}
		pdsBuffer.data = pdsBuffer.rgbToBgr(width, height);
		return [ pdsBuffer, compressedLen ];
	}

	private rgbToBgr(width: number, height: number): Buffer {
		const pitch = this.pitch();
		const from = this.data;
		const to = Buffer.alloc(pitch * height);
		for (let i = 0; i < height; i++) {
			for (let l = 0; l < width; l++) {
				if (this.format === BaseTexture.RGBA) {
					to[i * pitch + 4 * l] = from[i * pitch + 4 * l + 2];     // r
					to[i * pitch + 4 * l + 1] = from[i * pitch + 4 * l + 1]; // g
					to[i * pitch + 4 * l + 2] = from[i * pitch + 4 * l];     // b
					to[i * pitch + 4 * l + 3] = from[i * pitch + 4 * l + 3]; // a

				} else {
					to[i * pitch + 4 * l] = from[i * pitch + 4 * l + 6];     // r
					to[i * pitch + 4 * l + 1] = from[i * pitch + 4 * l + 7];
					to[i * pitch + 4 * l + 2] = from[i * pitch + 4 * l + 8];

					to[i * pitch + 4 * l + 3] = from[i * pitch + 4 * l + 3]; // g
					to[i * pitch + 4 * l + 4] = from[i * pitch + 4 * l + 4];
					to[i * pitch + 4 * l + 5] = from[i * pitch + 4 * l + 5];

					to[i * pitch + 4 * l + 6] = from[i * pitch + 4 * l];     // b
					to[i * pitch + 4 * l + 7] = from[i * pitch + 4 * l + 1];
					to[i * pitch + 4 * l + 8] = from[i * pitch + 4 * l + 2];

					to[i * pitch + 4 * l + 9] = from[i * pitch + 4 * l + 9]; // a
				}
			}
		}
		return to;
	}

	private pitch(): number {
		return (this.format === BaseTexture.RGBA ? 4 : 3 * 4) * this.width;
	}
}
