import { Table } from '..';
import { degToRad } from '../math/float';
import { Vertex3D } from '../math/vertex3d';
import { MoverObject } from '../physics/mover-object';

export class Player {

	public gravity = new Vertex3D();
	private readonly table: Table;
	private readonly movers: MoverObject[];
	private stateCallback?: (name: string, state: any) => void;

	constructor(table: Table) {
		this.table = table;
		this.movers = [];
		for (const flipperName of Object.keys(table.flippers)) {
			const flipper = table.flippers[flipperName];
			flipper.hit.flipperMover.setPlayer(this);
			this.movers.push(flipper.hit.flipperMover);
		}
	}

	public setOnStateChanged(callback: (name: string, state: any) => void): void {
		this.stateCallback = callback;
	}

	public changeState(name: string, state: any) {
		if (this.stateCallback) {
			this.stateCallback(name, state);
		}
	}

	public physicsSimulateCycle(dtime: number) {
		while (dtime > 0) {
			const hittime = dtime;

			for (const mover of this.movers) {
				mover.updateDisplacements(hittime);
			}

			dtime -= hittime;
		}
	}

	public updatePhysics() {
		for (const mover of this.movers) {
			mover.updateVelocities();
		}
	}

	public setGravity(slopeDeg: number, strength: number): void {
		this.gravity.x = 0;
		this.gravity.y = Math.sin(degToRad(slopeDeg)) * strength;
		this.gravity.z = -Math.cos(degToRad(slopeDeg)) * strength;
	}
}
