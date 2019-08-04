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

import { HitLine3D } from '../physics/hit-line-3d';
import { Vertex3D } from './vertex3d';

export class EdgeSet {

	private readonly edges: { [key: string]: [number, number] } = {};

	public add(a: number, b: number) {
		this.edges[this.getKey(a, b)] = [a, b];
	}

	public has(a: number, b: number): boolean {
		return !!this.edges[this.getKey(a, b)];
	}

	public addHitEdge(i: number, j: number, vi: Vertex3D, vj: Vertex3D): HitLine3D[] {
		// create pair uniquely identifying the edge (i,j)
		const a = Math.min(i, j);
		const b = Math.max(i, j);

		if (!this.has(a, b)) {   // edge not yet added?
			this.add(a, b);
			return [new HitLine3D(vi, vj)];
		}
		return [];
	}

	private getKey(a: number, b: number): string {
		return `${a},${b}`;
	}
}
