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

import { Stream } from 'stream';
import { Storage } from '../../io/ole-doc';
import { Binary } from '../../vpt/binary';
import { ITextureImporter } from '../irender-api';

export class ThreeTextureConverterBrowser implements ITextureImporter<HTMLImageElement, ArrayBufferLike> {

	public async getRawImage(data: Buffer, width: number, height: number): Promise<ArrayBufferLike> {
		return undefined;
	}

	public async loadImage(name: string, data: Buffer, width: number, height: number): Promise<HTMLImageElement> {
		const img = new Image();
		const header = data.readUInt16BE(0);
		let mimeType: string;
		switch (header) {
			case 0x8950: mimeType = 'image/png'; break;
			case 0x4749: mimeType = 'image/gif'; break;
			case 0x424d: mimeType = 'image/bmp'; break;
			case 0xffd8: mimeType = 'image/jpg'; break;
			default: mimeType = 'image/unknown'; break;
		}
		const blob = new Blob([data.buffer], {type: mimeType});
		img.src = URL.createObjectURL(blob);
		return Promise.resolve(img);
	}

	public async loadRawImage(name: string, data: ArrayBufferLike, width: number, height: number): Promise<HTMLImageElement> {
		return undefined;
	}

	public async streamImage(storage: Storage, storageName?: string, binary?: Binary, localPath?: string): Promise<Buffer> {
		let strm: Stream;
		if (localPath) {
			// FIXME require stuff
			return Promise.resolve(Buffer.alloc(0));
		} else {
			strm = storage.stream(storageName!, binary!.pos, binary!.len);
		}
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

}
