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

import { Texture as ThreeTexture } from 'three';
import { logger } from '../../util/logger';
import { Table } from '../../vpt/table/table';
import { Texture } from '../../vpt/texture';
import { ITextureLoader } from '../irender-api';

export class ThreeMapGenerator {

	private readonly textureLoader: ITextureLoader<ThreeTexture> | undefined;
	private readonly textureCache: Map<string, ThreeTexture> = new Map();

	constructor(textureLoader: ITextureLoader<ThreeTexture> | undefined) {
		this.textureLoader = textureLoader;
	}

	public async loadTextures(textures: Texture[], table: Table): Promise<void> {
		if (!this.textureLoader) {
			return Promise.resolve();
		}
		const now = Date.now();
		logger().debug('[ThreeMapGenerator.loadTextures] Pre-loading textures..');
		for (const texture of textures) {
			try {
				this.textureCache.set(texture.getName(), await texture.loadTexture(this.textureLoader, table));
			} catch (err) {
				logger().warn('[ThreeMapGenerator.loadTextures] Error loading texture %s (%s/%s): %s', texture.getName(), texture.storageName, texture.getName(), err.message);
			}
		}
		logger().debug('[ThreeMapGenerator.loadTextures] Loaded in %sms.', Date.now() - now);
	}

	public getTexture(name: string): ThreeTexture {
		return this.textureCache.get(name)!;
	}

	public hasTexture(name: string): boolean {
		return this.textureCache.has(name);
	}
}
