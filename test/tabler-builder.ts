import { Material } from '../lib/vpt/material';
import { TableData } from '../lib/vpt/table/table-data';
import { RampData } from '../lib/vpt/ramp/ramp-data';
import { Ramp } from '../lib/vpt/ramp/ramp';
import { LoadedTable, TableLoader } from '../lib/vpt/table/table-loader';
import { Table } from '../lib/vpt/table/table';

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
