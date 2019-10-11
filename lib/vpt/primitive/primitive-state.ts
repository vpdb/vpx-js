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

import { Vertex3D } from '../../math/vertex3d';
import { Pool } from '../../util/object-pool';
import { ItemState } from '../item-state';

export class PrimitiveState extends ItemState {

	public static readonly POOL = new Pool(PrimitiveState);

	public position: Vertex3D = Vertex3D.claim();
	public size: Vertex3D = Vertex3D.claim();
	public rotation: Vertex3D = Vertex3D.claim();        // rotAndTra[0,1,2]
	public translation: Vertex3D = Vertex3D.claim();     // rotAndTra[3,4,5]
	public objectRotation: Vertex3D = Vertex3D.claim();  // rotAndTra[6,7,8]
	public material?: string;
	public map?: string;
	public normalMap?: string;

	public constructor() {
		super();
	}

	public static claimFrom(name: string, position: Vertex3D, size: Vertex3D, rotAndTra: number[], material: string | undefined, map: string | undefined, normalMap: string | undefined, isVisible: boolean) {
		return this.claim(
			name,
			position,
			size,
			Vertex3D.claim(rotAndTra[0], rotAndTra[1], rotAndTra[2]),
			Vertex3D.claim(rotAndTra[3], rotAndTra[4], rotAndTra[5]),
			Vertex3D.claim(rotAndTra[6], rotAndTra[7], rotAndTra[8]),
			material,
			map,
			normalMap,
			isVisible,
		);
	}

	public static claim(name: string, position: Vertex3D, size: Vertex3D, rotation: Vertex3D, translation: Vertex3D, objectRotation: Vertex3D, material: string | undefined, map: string | undefined, normalMap: string | undefined, isVisible: boolean): PrimitiveState {
		const state = PrimitiveState.POOL.get();
		state.name = name;
		state.position = position;
		state.size = size;
		state.rotation = rotation;
		state.translation = translation;
		state.objectRotation = objectRotation;
		state.material = material;
		state.map = map;
		state.normalMap = map;
		state.isVisible = isVisible;
		return state;
	}

	public clone(): PrimitiveState {
		return PrimitiveState.claim(
			this.name,
			this.position,
			this.size,
			this.rotation,
			this.translation,
			this.objectRotation,
			this.material,
			this.map,
			this.normalMap,
			this.isVisible,
		);
	}

	public diff(state: PrimitiveState): PrimitiveState {
		const diff = this.clone();
		if (diff.position.equals(state.position)) {
			Vertex3D.release(diff.position);
			delete diff.position;
		}
		if (diff.size.equals(state.size)) {
			Vertex3D.release(diff.size);
			delete diff.size;
		}
		if (diff.rotation.equals(state.rotation)) {
			Vertex3D.release(diff.rotation);
			delete diff.rotation;
		}
		if (diff.translation.equals(state.translation)) {
			Vertex3D.release(diff.translation);
			delete diff.translation;
		}
		if (diff.objectRotation.equals(state.objectRotation)) {
			Vertex3D.release(diff.objectRotation);
			delete diff.objectRotation;
		}
		if (diff.material === state.material) {
			delete diff.material;
		}
		if (diff.map === state.map) {
			delete diff.map;
		}
		if (diff.normalMap === state.normalMap) {
			delete diff.normalMap;
		}
		if (diff.isVisible === state.isVisible) {
			delete diff.isVisible;
		}
		return diff;
	}

	public release(): void {
		if (!this.position) {
			this.position = Vertex3D.claim();
		}
		if (!this.size) {
			this.size = Vertex3D.claim();
		}
		if (!this.rotation) {
			this.rotation = Vertex3D.claim();
		}
		if (!this.translation) {
			this.translation = Vertex3D.claim();
		}
		if (!this.objectRotation) {
			this.objectRotation = Vertex3D.claim();
		}
		PrimitiveState.POOL.release(this);
	}

	public equals(state: PrimitiveState): boolean {
		/* istanbul ignore if: we don't actually pass empty states. */
		if (!state) {
			return false;
		}
		return state.position.equals(this.position)
			&& state.size.equals(this.size)
			&& state.rotation.equals(this.rotation)
			&& state.translation.equals(this.translation)
			&& state.objectRotation.equals(this.objectRotation)
			&& state.material === this.material
			&& state.map === this.map
			&& state.normalMap === this.normalMap
			&& state.isVisible === this.isVisible;
	}
}
