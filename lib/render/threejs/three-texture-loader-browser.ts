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

import { DataTexture, RGBAFormat, Texture as ThreeTexture, TextureLoader, UnsignedByteType } from '../../refs.node';
import { ITextureLoader } from '../irender-api';
import { RGBELoader } from './vendor/RGBELoader';

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

	public async loadDefaultTexture(name: string, ext: string, fileName: string): Promise<ThreeTexture> {
		const key = fileName.substr(0, fileName.lastIndexOf('.'));
		if (!imageMap[key]) {
			throw new Error('Unknown local texture "' + key + '".');
		}
		return Promise.resolve(new TextureLoader().load(imageMap[key]));
	}

	public async loadRawTexture(name: string, data: Buffer, width: number, height: number): Promise<ThreeTexture> {
		const texture = new DataTexture(data, width, height, RGBAFormat);
		texture.flipY = true;
		texture.needsUpdate = true;
		return Promise.resolve(texture);
	}

	public async loadTexture(name: string, ext: string, data: Buffer): Promise<ThreeTexture> {
		const mimeType = getMimeType(data, ext);
		if (!mimeType) {
			throw new Error('Unknown image format for texture "' + name + '".');
		}
		const objectUrl = URL.createObjectURL(new Blob([data.buffer], {type: mimeType}));
		const texture = await load(mimeType, objectUrl);
		texture.name = `texture:${name}`;
		texture.needsUpdate = true;
		return Promise.resolve(texture);
	}
}

function getMimeType(data: Buffer, ext: string): string | null {
	const header = data.readUInt16BE(0);
	switch (header) {
		case 0x8950: return 'image/png';
		case 0x4749: return 'image/gif';
		case 0x424d: return 'image/bmp';
		case 0xffd8: return 'image/jpg';
		default: switch (ext) {
			case '.hdr': return 'application/octet-stream';
			case '.exr': return 'image/aces';
			default: return null;
		}
	}
}

async function load(mimeType: string, objectUrl: string): Promise<ThreeTexture> {
	if (mimeType === 'application/octet-stream') {
		return await loadHdrTexture(objectUrl);
	}
	return Promise.resolve(loadLdrTexture(objectUrl));
}

function loadLdrTexture(objectUrl: string): ThreeTexture {
	const texture = new ThreeTexture();
	texture.image = new Image();
	texture.image.src = objectUrl;
	return texture;
}

async function loadHdrTexture(objectUrl: string): Promise<ThreeTexture> {
	return new Promise((resolve, reject) => {
		new RGBELoader()
			.setDataType(UnsignedByteType) // alt: FloatType, HalfFloatType
			.load(objectUrl, texture => resolve(texture), undefined, reject);
	});
}
