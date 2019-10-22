import { Material } from '../lib/vpt/material';
import { TableData } from '../lib/vpt/table/table-data';
import { RampData } from '../lib/vpt/ramp/ramp-data';
import { Ramp } from '../lib/vpt/ramp/ramp';
import { LoadedTable, TableLoader } from '../lib/vpt/table/table-loader';
import { Table } from '../lib/vpt/table/table';
import { DragPoint } from '../lib/math/dragpoint';
import { Vertex3D } from '../lib/math/vertex3d';

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
