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

import { HitObject } from '../../physics/hit-object';
import { Table } from '../table';
import { RubberData } from './rubber-data';
import { RubberMeshGenerator } from './rubber-mesh-generator';

export class RubberHitGenerator {

	private readonly data: RubberData;
	private readonly meshGenerator: RubberMeshGenerator;

	constructor(data: RubberData, meshGenerator: RubberMeshGenerator) {
		this.data = data;
		this.meshGenerator = meshGenerator;
	}

	public generateHitObjects(table: Table): HitObject[] {
		return [];
	}
}
