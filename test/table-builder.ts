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

import { Material } from '../lib/vpt/material';
import { TableData } from '../lib/vpt/table/table-data';
import { RampData } from '../lib/vpt/ramp/ramp-data';
import { Ramp } from '../lib/vpt/ramp/ramp';
import { LoadedTable, TableLoader } from '../lib/vpt/table/table-loader';
import { Table } from '../lib/vpt/table/table';
import { DragPoint } from '../lib/math/dragpoint';
import { Vertex3D } from '../lib/math/vertex3d';
import { PrimitiveData } from '../lib/vpt/primitive/primitive-data';
import { Primitive } from '../lib/vpt/primitive/primitive';
import { BumperData } from '../lib/vpt/bumper/bumper-data';
import { Vertex2D } from '../lib/math/vertex2d';
import { Bumper } from '../lib/vpt/bumper/bumper';

export class TableBuilder {

	private readonly table: LoadedTable = { items: {} };

	private gameItem = 0;

	public constructor() {
		this.table.data = new TableData(`GameItem${this.gameItem++}`);
	}

	public addMaterial(name: string, attrs: any = {}): this {
		const mat = new Material();
		mat.name = name;
		Object.assign(mat, attrs);
		this.table.data!.materials.push(mat);
		return this;
	}

	public addPrimitive(name: string, attrs: any = {}): this {
		const data = new PrimitiveData(`GameItem${this.gameItem++}`, true);
		data.name = name;
		data.position = new Vertex3D(500, 500);
		Object.assign(data, attrs);

		const primitive = new Primitive(data);
		this.table.items[name] = primitive;
		if (!this.table.primitives) {
			this.table.primitives = [];
		}
		this.table.primitives.push(primitive);
		return this;
	}

	public addBumper(name: string, attrs: any = {}): this {
		const data = new BumperData(`GameItem${this.gameItem++}`);
		data.name = name;
		data.center = new Vertex2D(500, 500);
		Object.assign(data, attrs);

		const bumper = new Bumper(data);
		this.table.items[name] = bumper;
		if (!this.table.bumpers) {
			this.table.bumpers = [];
		}
		this.table.bumpers.push(bumper);
		return this;
	}

	public addRamp(name: string, attrs: any = {}): this {
		const data = new RampData(`GameItem${this.gameItem++}`);
		data.name = name;
		const dp1 = new DragPoint();
		const dp2 = new DragPoint();
		dp1.vertex = new Vertex3D(500, 500, 50);
		dp2.vertex = new Vertex3D(700, 700, 50);
		data.dragPoints = [ dp1, dp2 ];
		Object.assign(data, attrs);
		const ramp = new Ramp(data);

		this.table.items[name] = ramp;
		if (!this.table.ramps) {
			this.table.ramps = [];
		}
		this.table.ramps.push(ramp);
		return this;
	}

	public build(): Table {
		return new Table(new TableLoader(), this.table);
	}
}
