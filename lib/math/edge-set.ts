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

/**
 * This implements a set based on a number pair.
 * The order in which the numbers are provided doesn't matter because they
 * are sorted prior to checking the index.
 */
export class EdgeSet {
	private readonly edges = new Set<string>();

	public add(i: number, j: number) {
		this.edges.add(this.getKey(i, j));
	}

	public has(i: number, j: number): boolean {
		return this.edges.has(this.getKey(i, j));
	}

	public addHitEdge(i: number, j: number, vi: Vertex3D, vj: Vertex3D): HitLine3D[] {
		if (!this.has(i, j)) {
			// edge not yet added?
			this.add(i, j);
			return [new HitLine3D(vi, vj)];
		}
		return [];
	}

	private getKey(i: number, j: number): string {
		return `${Math.min(i, j)},${Math.max(i, j)}`;
	}
}
