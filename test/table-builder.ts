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
import { FlipperData } from '../lib/vpt/flipper/flipper-data';
import { Flipper } from '../lib/vpt/flipper/flipper';
import { GateData } from '../lib/vpt/gate/gate-data';
import { Gate } from '../lib/vpt/gate/gate';
import { HitTargetData } from '../lib/vpt/hit-target/hit-target-data';
import { HitTarget } from '../lib/vpt/hit-target/hit-target';
import { KickerData } from '../lib/vpt/kicker/kicker-data';
import { Kicker } from '../lib/vpt/kicker/kicker';
import { RubberData } from '../lib/vpt/rubber/rubber-data';
import { Rubber } from '../lib/vpt/rubber/rubber';
import { SpinnerData } from '../lib/vpt/spinner/spinner-data';
import { Spinner } from '../lib/vpt/spinner/spinner';
import { SurfaceData } from '../lib/vpt/surface/surface-data';
import { Surface } from '../lib/vpt/surface/surface';
import { TriggerData } from '../lib/vpt/trigger/trigger-data';
import { Trigger } from '../lib/vpt/trigger/trigger';

export class TableBuilder {

	private readonly table: LoadedTable = { items: {} };

	private gameItem = 0;
	private static tableItem = 0;

	public constructor() {
		this.table.data = new TableData(`GameItem${this.gameItem++}`);
		this.table.data.name = `Table${TableBuilder.tableItem++}`;
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

	public addFlipper(name: string, attrs: any = {}): this {
		const data = new FlipperData(`GameItem${this.gameItem++}`);
		data.name = name;
		data.center = new Vertex2D(500, 500);
		Object.assign(data, attrs);

		const flipper = new Flipper(data);
		this.table.items[name] = flipper;
		if (!this.table.flippers) {
			this.table.flippers = [];
		}
		this.table.flippers.push(flipper);
		return this;
	}

	public addGate(name: string, attrs: any = {}): this {
		const data = new GateData(`GameItem${this.gameItem++}`);
		data.name = name;
		data.center = new Vertex2D(500, 500);
		Object.assign(data, attrs);

		const gate = new Gate(data);
		this.table.items[name] = gate;
		if (!this.table.gates) {
			this.table.gates = [];
		}
		this.table.gates.push(gate);
		return this;
	}

	public addHitTarget(name: string, attrs: any = {}): this {
		const data = new HitTargetData(`GameItem${this.gameItem++}`);
		data.name = name;
		data.position = new Vertex3D(500, 500, 0);
		Object.assign(data, attrs);

		const hitTarget = new HitTarget(data);
		this.table.items[name] = hitTarget;
		if (!this.table.hitTargets) {
			this.table.hitTargets = [];
		}
		this.table.hitTargets.push(hitTarget);
		return this;
	}

	public addKicker(name: string, attrs: any = {}): this {
		const data = new KickerData(`GameItem${this.gameItem++}`);
		data.name = name;
		data.center = new Vertex2D(500, 500);
		Object.assign(data, attrs);

		const kicker = new Kicker(data);
		this.table.items[name] = kicker;
		if (!this.table.kickers) {
			this.table.kickers = [];
		}
		this.table.kickers.push(kicker);
		return this;
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

	public addRubber(name: string, attrs: any = {}): this {
		const data = new RubberData(`GameItem${this.gameItem++}`);
		data.name = name;
		const dp1 = new DragPoint();
		const dp2 = new DragPoint();
		dp1.vertex = new Vertex3D(500, 500, 50);
		dp2.vertex = new Vertex3D(700, 700, 50);
		data.dragPoints = [ dp1, dp2 ];
		Object.assign(data, attrs);

		const rubber = new Rubber(data);
		this.table.items[name] = rubber;
		if (!this.table.rubbers) {
			this.table.rubbers = [];
		}
		this.table.rubbers.push(rubber);
		return this;
	}

	public addSpinner(name: string, attrs: any = {}): this {
		const data = new SpinnerData(`GameItem${this.gameItem++}`);
		data.name = name;
		data.center = new Vertex2D(500, 500);
		Object.assign(data, attrs);

		const spinner = new Spinner(data);
		this.table.items[name] = spinner;
		if (!this.table.spinners) {
			this.table.spinners = [];
		}
		this.table.spinners.push(spinner);
		return this;
	}

	public addSurface(name: string, attrs: any = {}): this {
		const data = new SurfaceData(`GameItem${this.gameItem++}`);
		data.name = name;
		const dp1 = new DragPoint();
		const dp2 = new DragPoint();
		const dp3 = new DragPoint();
		dp1.vertex = new Vertex3D(500, 500, 50);
		dp2.vertex = new Vertex3D(700, 700, 50);
		dp3.vertex = new Vertex3D(400, 600, 50);
		data.dragPoints = [ dp1, dp2, dp3 ];
		Object.assign(data, attrs);
		const surface = new Surface(data);

		this.table.items[name] = surface;
		if (!this.table.surfaces) {
			this.table.surfaces = [];
		}
		this.table.surfaces.push(surface);
		return this;
	}

	public addTrigger(name: string, attrs: any = {}): this {
		const data = new TriggerData(`GameItem${this.gameItem++}`);
		data.name = name;
		data.center = new Vertex2D(500, 500);
		const dp1 = new DragPoint();
		const dp2 = new DragPoint();
		const dp3 = new DragPoint();
		dp1.vertex = new Vertex3D(500, 500, 50);
		dp2.vertex = new Vertex3D(700, 700, 50);
		dp3.vertex = new Vertex3D(400, 600, 50);
		data.dragPoints = [ dp1, dp2, dp3 ];
		Object.assign(data, attrs);

		const trigger = new Trigger(data);
		this.table.items[name] = trigger;
		if (!this.table.triggers) {
			this.table.triggers = [];
		}
		this.table.triggers.push(trigger);
		return this;
	}

	public build(): Table {
		return new Table(new TableLoader(), this.table);
	}
}
