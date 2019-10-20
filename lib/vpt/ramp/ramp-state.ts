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

import { Pool } from '../../util/object-pool';
import { ItemState } from '../item-state';

export class RampState extends ItemState {

	public static readonly POOL = new Pool(RampState);

	public type?: number;

	public heightBottom!: number;
	public heightTop!: number;
	public widthBottom!: number;
	public widthTop!: number;
	public leftWallHeight?: number;
	public rightWallHeight?: number;
	public leftWallHeightVisible!: number;
	public rightWallHeightVisible!: number;
	public depthBias?: number;

	public material?: string;
	public texture?: string;
	public textureAlignment?: number;
	public hasWallImage?: boolean;

	public constructor() {
		super();
	}

	public static claim(name: string, heightBottom: number, heightTop: number,
						widthBottom: number, widthTop: number,
						leftWallHeight: number | undefined, rightWallHeight: number | undefined,
						leftWallHeightVisible: number, rightWallHeightVisible: number,
						type: number | undefined,
						material: string | undefined, texture: string | undefined, textureAlignment: number | undefined,
						hasWallImage: boolean | undefined, depthBias: number | undefined, isVisible: boolean): RampState {

		const state = RampState.POOL.get();
		state.name = name;
		state.heightBottom = heightBottom;
		state.heightTop = heightTop;
		state.widthBottom = widthBottom;
		state.widthTop = widthTop;
		state.leftWallHeight = leftWallHeight;
		state.rightWallHeight = rightWallHeight;
		state.leftWallHeightVisible = leftWallHeightVisible;
		state.rightWallHeightVisible = rightWallHeightVisible;
		state.type = type;
		state.material = material;
		state.texture = texture;
		state.textureAlignment = textureAlignment;
		state.hasWallImage = hasWallImage;
		state.depthBias = depthBias;
		state.isVisible = isVisible;
		return state;
	}

	public clone(): RampState {
		return RampState.claim(
			this.name,
			this.heightBottom,
			this.heightTop,
			this.widthBottom,
			this.widthTop,
			this.leftWallHeight,
			this.rightWallHeight,
			this.leftWallHeightVisible,
			this.rightWallHeightVisible,
			this.type,
			this.material,
			this.texture,
			this.textureAlignment,
			this.hasWallImage,
			this.depthBias,
			this.isVisible,
		);
	}

	public diff(state: RampState): RampState {
		const diff = this.clone();
		if (diff.heightBottom === state.heightBottom) {
			delete diff.heightBottom;
		}
		if (diff.heightTop === state.heightTop) {
			delete diff.heightTop;
		}
		if (diff.widthBottom === state.widthBottom) {
			delete diff.widthBottom;
		}
		if (diff.widthTop === state.widthTop) {
			delete diff.widthTop;
		}
		if (diff.leftWallHeight === state.leftWallHeight) {
			delete diff.leftWallHeight;
		}
		if (diff.rightWallHeight === state.rightWallHeight) {
			delete diff.rightWallHeight;
		}
		if (diff.leftWallHeightVisible === state.leftWallHeightVisible) {
			delete diff.leftWallHeightVisible;
		}
		if (diff.rightWallHeightVisible === state.rightWallHeightVisible) {
			delete diff.rightWallHeightVisible;
		}
		if (diff.type === state.type) {
			delete diff.type;
		}
		if (diff.material === state.material) {
			delete diff.material;
		}
		if (diff.texture === state.texture) {
			delete diff.texture;
		}
		if (diff.textureAlignment === state.textureAlignment) {
			delete diff.textureAlignment;
		}
		if (diff.hasWallImage === state.hasWallImage) {
			delete diff.hasWallImage;
		}
		if (diff.depthBias === state.depthBias) {
			delete diff.depthBias;
		}
		if (diff.isVisible === state.isVisible) {
			delete diff.isVisible;
		}
		return diff;
	}

	public release(): void {
		RampState.POOL.release(this);
	}

	public equals(state: RampState): boolean {
		/* istanbul ignore if: we don't actually pass empty states. */
		if (!state) {
			return false;
		}
		return state.heightBottom === this.heightBottom
			&& state.heightTop === this.heightTop
			&& state.widthBottom === this.widthBottom
			&& state.widthTop === this.widthTop
			&& state.leftWallHeight === this.leftWallHeight
			&& state.rightWallHeight === this.rightWallHeight
			&& state.leftWallHeightVisible === this.leftWallHeightVisible
			&& state.rightWallHeightVisible === this.rightWallHeightVisible
			&& state.type === this.type
			&& state.material === this.material
			&& state.texture === this.texture
			&& state.textureAlignment === this.textureAlignment
			&& state.hasWallImage === this.hasWallImage
			&& state.depthBias === this.depthBias
			&& state.isVisible === this.isVisible;
	}
}
