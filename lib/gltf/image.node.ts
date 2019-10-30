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

import * as sharp from 'sharp';
import { logger } from '../util/logger';

const PngQuant = require('pngquant');

/**
 * Holds a physical image that can be processed by GLTFExporter.
 *
 * It uses Sharp for reprocessing, crushes PNGs with PngQuant and converts
 * PNGs to JPEGs when no alpha channel is found.
 */
export class NodeImage {
	private static readonly jpegQuality = 65;

	public readonly src: string;
	public width: number;
	public height: number;

	private readonly format: string;
	private readonly stats: sharp.Stats;
	private readonly sharp: sharp.Sharp;

	public constructor(
		src: string,
		width: number,
		height: number,
		format: string,
		stats: sharp.Stats,
		shrp: sharp.Sharp,
	) {
		this.src = src;
		this.width = width;
		this.height = height;
		this.format = format;

		this.stats = stats;
		this.sharp = shrp;
	}

	public resize(width: number, height: number): this {
		this.sharp.resize(width, height, { fit: 'fill' });
		this.width = width;
		this.height = height;
		return this;
	}

	public flipY(): this {
		this.sharp.flip();
		return this;
	}

	public getFormat(): string {
		return this.format;
	}

	public getMimeType(): string {
		return !this.stats.isOpaque ? 'image/png' : 'image/jpeg';
	}

	public async getImage(optimize: boolean, quality = NodeImage.jpegQuality): Promise<Buffer> {
		if (this.stats.isOpaque) {
			if (this.format === 'png') {
				logger().debug('[Image.getImage]: Converting opaque png to jpeg.');
			}
			return this.sharp.jpeg({ quality }).toBuffer();
		}

		switch (this.format) {
			case 'png': {
				if (optimize) {
					const quanter = new PngQuant([128]);
					return new Promise((resolve, reject) => {
						const buffers: Buffer[] = [];
						this.sharp
							.on('error', reject)
							.pipe(quanter)
							.on('error', reject)
							.on('data', (buf: Buffer) => buffers.push(buf as Buffer))
							.on('end', () => resolve(Buffer.concat(buffers)))
							.on('error', reject);
					});
				}
				return this.sharp.toBuffer();
			}

			default: {
				return this.sharp.jpeg({ quality: NodeImage.jpegQuality }).toBuffer();
			}
		}
	}

	public hasTransparency(): boolean {
		return ['png', 'webp', 'gif'].includes(this.format);
	}

	public containsTransparency(): boolean {
		return !this.stats.isOpaque;
	}
}
