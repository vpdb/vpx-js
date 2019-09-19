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

import { createReadStream } from 'fs';
import { resolve as resolvePath } from 'path';
import * as sharp from 'sharp';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { UnsignedByteType } from 'three/src/constants';
import { Texture as ThreeTexture } from 'three/src/textures/Texture';
import { NodeImage } from '../../gltf/image.node';
import { logger } from '../../util/logger';
import { ITextureLoader } from '../irender-api';

export class ThreeTextureLoaderNode implements ITextureLoader<ThreeTexture> {

	public async loadTexture(name: string, ext: string, data: Buffer): Promise<ThreeTexture> {
		try {
			return await loadSharpImage(name, sharp(data));

		} catch (err) {
			logger().warn('[Image.init] Could not read metadata from buffer (%s), using GM to read image.', err.message);

			if (ext === '.hdr') {
				return await loadHdrImage(name, data);

			} else {
				throw err;
			}
		}
	}

	public async loadRawTexture(name: string, data: Buffer, width: number, height: number): Promise<ThreeTexture> {
		return loadSharpImage(name, sharp(data, {
			raw: {
				width,
				height,
				channels: 4,
			},
		}).png());
	}

	public async loadDefaultTexture(name: string, ext: string, fileName: string): Promise<ThreeTexture> {
		const filePath = resolvePath(__dirname, '../../..', 'res', 'maps', fileName);
		return this.loadTexture(name, ext, await stream(filePath));
	}
}

async function stream(localPath: string): Promise<Buffer> {
	const readStream = createReadStream(localPath);
	return new Promise<Buffer>((resolve, reject) => {
		const buffers: Buffer[] = [];
		/* istanbul ignore if */
		if (!readStream) {
			return reject(new Error('No such stream "' + localPath + '".'));
		}
		readStream.on('error', reject);
		readStream.on('data', (buf: Buffer) => buffers.push(buf));
		readStream.on('end', () => resolve(Buffer.concat(buffers)));
	});
}

async function loadSharpImage(name: string, shrp: sharp.Sharp, parsedMeta?: { format: string, width: number, height: number }): Promise<ThreeTexture> {
	const stats = await shrp.stats();
	let image: NodeImage;
	if (parsedMeta) {
		image = new NodeImage(name, parsedMeta.width, parsedMeta.height, parsedMeta.format, stats, shrp);
	} else {
		const metadata = await shrp.metadata();
		image = new NodeImage(name, metadata.width!, metadata.height!, metadata.format!, stats, shrp);
	}

	const texture = new ThreeTexture();
	texture.name = `texture:${name}`;
	texture.image = image;
	return texture;
}

async function loadHdrImage(name: string, data: Buffer): Promise<ThreeTexture> {
	return new Promise(resolve => {
		new RGBELoader()
			.setDataType(UnsignedByteType) // alt: FloatType, HalfFloatType
			.load(data as any, texture => resolve(texture));
	});
}
