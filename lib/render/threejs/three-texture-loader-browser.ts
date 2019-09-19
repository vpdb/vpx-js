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

import { RGBAFormat } from 'three/src/constants';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { DataTexture } from 'three/src/textures/DataTexture';
import { Texture as ThreeTexture } from 'three/src/textures/Texture';
import { ITextureLoader } from '../irender-api';

const imageMap: { [key: string]: string } = {
	bumperbase: require('../../../res/maps/bumperbase.png'),
	bumperCap: require('../../../res/maps/bumperCap.png'),
	bumperring: require('../../../res/maps/bumperring.png'),
	bumperskirt: require('../../../res/maps/bumperskirt.png'),
	kickerCup: require('../../../res/maps/kickerCup.png'),
	kickerGottlieb: require('../../../res/maps/kickerGottlieb.png'),
	kickerHoleWood: require('../../../res/maps/kickerHoleWood.png'),
	kickerT1: require('../../../res/maps/kickerT1.png'),
	kickerWilliams: require('../../../res/maps/kickerWilliams.png'),
	ball: require('../../../res/maps/ball.png'),
};

export class ThreeTextureLoaderBrowser implements ITextureLoader<ThreeTexture> {

	public loadDefaultTexture(name: string, ext: string, fileName: string): Promise<ThreeTexture> {
		const key = fileName.substr(0, fileName.lastIndexOf('.'));
		if (!imageMap[key]) {
			throw new Error('Unknown local texture "' + key + '".');
		}
		return Promise.resolve(new TextureLoader().load(imageMap[key]));
	}

	public loadRawTexture(name: string, data: Buffer, width: number, height: number): Promise<ThreeTexture> {
		const texture = new DataTexture(data, width, height, RGBAFormat);
		texture.flipY = true;
		texture.needsUpdate = true;
		return Promise.resolve(texture);
	}

	public loadTexture(name: string, ext: string, data: Buffer): Promise<ThreeTexture> {
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
