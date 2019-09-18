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

import { DataTexture, RGBAFormat, Texture as ThreeTexture } from 'three';
import { ITextureLoader } from '../irender-api';

export class ThreeTextureLoaderBrowser implements ITextureLoader<ThreeTexture> {

	public loadDefaultTexture(name: string, fileName: string): Promise<ThreeTexture> {
		//return Promise.resolve(new TextureLoader().load(fileName));
		throw new Error('Not supported');
	}

	public loadRawTexture(name: string, data: Buffer, width: number, height: number): Promise<ThreeTexture> {
		const texture = new DataTexture(data, width, height, RGBAFormat);
		texture.flipY = true;
		texture.needsUpdate = true;
		return Promise.resolve(texture);
	}

	public loadTexture(name: string, data: Buffer): Promise<ThreeTexture> {
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
		const img = new Image();
		img.src = URL.createObjectURL(blob);
		const texture = new ThreeTexture();
		texture.name = `texture:${name}`;
		texture.image = img;
		texture.needsUpdate = true;
		return Promise.resolve(texture);
	}
}
