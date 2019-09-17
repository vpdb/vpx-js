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

import * as gm from 'gm';
import { State } from 'gm';
import * as sharp from 'sharp';
import { Stream } from 'stream';
import { NodeImage } from '../../gltf/image.node';
import { Storage } from '../../io/ole-doc';
import { logger } from '../../util/logger';
import { Binary } from '../../vpt/binary';
import { ITextureImporter } from '../irender-api';

export class ThreeTextureConverterNode implements ITextureImporter<NodeImage, sharp.Sharp> {

	public async loadImage(name: string, data: Buffer): Promise<NodeImage> {
		try {
			return this.loadSharpImage(name, sharp(data));

		} catch (err) {
			logger().warn('[Image.init] Could not read metadata from buffer (%s), using GM to read image.', err.message);

			const g = gm(data);
			const metadata = await gmIdentify(g);
			const format = metadata.format.toLowerCase();
			const width = metadata.size.width;
			const height = metadata.size.height;
			const gmData: Buffer = await new Promise((resolve, reject) => {
				const buffers: Buffer[] = [];
				g.setFormat('jpeg').stream().on('error', reject)
					.on('data', (buf: Buffer) => buffers.push(buf as Buffer))
					.on('end', () => resolve(Buffer.concat(buffers)))
					.on('error', reject);
			});
			return this.loadSharpImage(name, sharp(gmData), { format, width, height });
		}
	}

	public async loadRawImage(src: string, shrp: sharp.Sharp): Promise<NodeImage> {
		return this.loadSharpImage(src, shrp);
	}

	public async getRawImage(data: Buffer, width: number, height: number): Promise<sharp.Sharp> {
		return Promise.resolve(sharp(data, {
			raw: {
				width,
				height,
				channels: 4,
			},
		}).png());
	}

	public async streamImage(storage: Storage, storageName?: string, binary?: Binary, localPath?: string): Promise<Buffer> {
		let strm: Stream;
		if (localPath) {
			strm = gm(localPath).stream();
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

	private async loadSharpImage(name: string, shrp: sharp.Sharp, parsedMeta?: { format: string, width: number, height: number }): Promise<NodeImage> {
		const stats = await shrp.stats();
		if (parsedMeta) {
			return new NodeImage(name, parsedMeta.width, parsedMeta.height, parsedMeta.format, stats, shrp);
		}
		const metadata = await shrp.metadata();
		return new NodeImage(name, metadata.width!, metadata.height!, metadata.format!, stats, shrp);
	}
}

async function gmIdentify(g: State): Promise<any> {
	return new Promise((resolve, reject) => {
		g.identify((err, value) => {
			if (err) {
				return reject(err);
			}
			resolve(value);
		});
	});
}
