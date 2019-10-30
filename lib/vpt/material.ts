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

import { BiffParser } from '../io/biff-parser';
import { Texture } from './texture';

/**
 * VPinball's material definition.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/Material.h
 */
export class Material {
	public name!: string;
	/**
	 *  Wrap/rim lighting factor (0(off)..1(full))
	 */
	public wrapLighting?: number;

	/**
	 * Roughness seems to be mapped to the "specular" exponent.
	 *
	 * Comment when importing:
	 *
	 * > normally a wavefront material specular exponent ranges from 0..1000.
	 * > but our shininess calculation differs from the way how e.g. Blender is calculating the specular exponent
	 * > starting from 0.5 and use only half of the exponent resolution to get a similar look
	 *
	 * Then the roughness is converted like this:
	 * > mat->m_fRoughness = 0.5f + (tmp / 2000.0f);
	 *
	 * When sending to the render device, the roughness is defined like that:
	 * > fRoughness = exp2f(10.0f * mat->m_fRoughness + 1.0f); // map from 0..1 to 2..2048
	 *
	 */
	public roughness: number = 0.0;
	/**
	 * Use image also for the glossy layer (0(no tinting at all)..1(use image)),
	 * stupid quantization because of legacy loading/saving
	 */
	public glossyImageLerp: number = 1.0;
	/**
	 * Thickness for transparent materials (0(paper thin)..1(maximum)),
	 * stupid quantization because of legacy loading/saving
	 */
	public thickness: number = 0.05;
	/**
	 * Edge weight/brightness for glossy and clearcoat (0(dark edges)..1(full fresnel))
	 */
	public edge: number = 1.0;
	public edgeAlpha: number = 1.0;
	public opacity: number = 1.0;
	/**
	 * Can be overridden by texture on object itself
	 */
	public baseColor: number = 0xb469ff;
	/**
	 * Specular of glossy layer
	 */
	public glossiness: number = 0.0;
	/**
	 * Specular of clearcoat layer
	 */
	public clearCoat: number = 0.0;
	/**
	 * Is a metal material or not
	 */
	public isMetal: boolean = false;
	public isOpacityActive: boolean = false;

	// these are a additional props
	public emissiveColor?: number;
	public emissiveIntensity: number = 0;
	public emissiveMap?: Texture;

	// physics
	public elasticity: number = 0.0;
	public elasticityFalloff: number = 0.0;
	public friction: number = 0.0;
	public scatterAngle: number = 0.0;

	public static fromSaved(saveMaterial: SaveMaterial): Material {
		const material = new Material();
		material.name = saveMaterial.szName;
		material.baseColor = BiffParser.bgrToRgb(saveMaterial.baseColor);
		material.glossiness = BiffParser.bgrToRgb(saveMaterial.glossiness);
		material.clearCoat = BiffParser.bgrToRgb(saveMaterial.clearCoat);
		material.wrapLighting = saveMaterial.wrapLighting;
		material.roughness = saveMaterial.roughness;
		material.glossyImageLerp = 0; //1.0f - dequantizeUnsigned<8>(mats[i].fGlossyImageLerp); //!! '1.0f -' to be compatible with previous table versions
		material.thickness = 0; //(mats[i].fThickness == 0) ? 0.05f : dequantizeUnsigned<8>(mats[i].fThickness); //!! 0 -> 0.05f to be compatible with previous table versions
		material.edge = saveMaterial.edge;
		material.opacity = saveMaterial.opacity;
		material.isMetal = saveMaterial.isMetal;
		// tslint:disable-next-line:no-bitwise
		material.isOpacityActive = !!(saveMaterial.opacityActiveEdgeAlpha & 1);
		material.edgeAlpha = 0; //dequantizeUnsigned<7>(mats[i].bOpacityActiveEdgeAlpha >> 1);
		return material;
	}

	public static fromSerialized(blob: { [key: string]: any }): Material {
		const material = new Material();

		// primitives
		for (const key of Object.keys(blob)) {
			(material as any)[key] = blob[key];
		}

		return material;
	}

	public physUpdate(savePhysMat: SavePhysicsMaterial) {
		this.elasticity = savePhysMat.elasticity;
		this.elasticityFalloff = savePhysMat.elasticityFallOff;
		this.friction = savePhysMat.friction;
		this.scatterAngle = savePhysMat.scatterAngle;
	}
}

export class SaveMaterial {
	public static size = 76;

	public szName: string;
	public baseColor: number; // can be overriden by texture on object itself
	public glossiness: number; // specular of glossy layer
	public clearCoat: number; // specular of clearcoat layer
	public wrapLighting: number; // wrap/rim lighting factor (0(off)..1(full))
	public isMetal: boolean; // is a metal material or not
	public roughness: number; // roughness of glossy layer (0(diffuse)..1(specular))
	public glossyImageLerp: number; // use image also for the glossy layer (0(no tinting at all)..1(use image)), stupid quantization because of legacy loading/saving
	public edge: number; // edge weight/brightness for glossy and clearcoat (0(dark edges)..1(full fresnel))
	public thickness: number; // thickness for transparent materials (0(paper thin)..1(maximum)), stupid quantization because of legacy loading/saving
	public opacity: number; // opacity (0..1)
	public opacityActiveEdgeAlpha: number;

	constructor(buffer: Buffer, i = 0) {
		const offset = i * SaveMaterial.size;
		this.szName = BiffParser.parseNullTerminatedString(buffer.slice(offset, offset + 32));
		this.baseColor = buffer.readInt32LE(offset + 32);
		this.glossiness = buffer.readInt32LE(offset + 36);
		this.clearCoat = buffer.readInt32LE(offset + 40);
		this.wrapLighting = buffer.readFloatLE(offset + 44);
		this.isMetal = buffer.readInt8(offset + 48) > 0;
		this.roughness = buffer.readFloatLE(offset + 52);
		this.glossyImageLerp = buffer.readInt32LE(offset + 56);
		this.edge = buffer.readFloatLE(offset + 60);
		this.thickness = buffer.readInt32LE(offset + 64);
		this.opacity = buffer.readFloatLE(offset + 68);
		this.opacityActiveEdgeAlpha = buffer.readInt32LE(offset + 72);
	}
}

export class SavePhysicsMaterial {
	public static size = 48;

	public name: string;
	public elasticity: number;
	public elasticityFallOff: number;
	public friction: number;
	public scatterAngle: number;

	constructor(buffer: Buffer, i = 0) {
		const offset = i * SavePhysicsMaterial.size;
		this.name = BiffParser.parseNullTerminatedString(buffer.slice(offset, offset + 32));
		this.elasticity = buffer.readFloatLE(offset + 32);
		this.elasticityFallOff = buffer.readFloatLE(offset + 36);
		this.friction = buffer.readFloatLE(offset + 40);
		this.scatterAngle = buffer.readFloatLE(offset + 44);
	}
}
