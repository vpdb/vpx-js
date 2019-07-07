import { Table } from '..';
import { degToRad } from '../math/float';
import { Vertex3D } from '../math/vertex3d';
import { MoverObject } from '../physics/mover-object';
import { FlipperHit } from '../vpt/flipper/flipper-hit';

export class Player {

	public gravity = new Vertex3D();
	private readonly table: Table;
	private readonly movers: MoverObject[] = [];
	private readonly flipperHits: FlipperHit[] = [];
	private stateCallback?: (name: string, state: any) => void;

	constructor(table: Table) {
		this.table = table;
		this.table.setupPlayer(this);
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
			const hitTime = dtime;

			// find earliest time where a flipper collides with its stop
			// for (const flipperHit of this.flipperHits) {
			// 	const flipperHitTime = flipperHit.getHitTime();
			// 	if (flipperHitTime > 0 && flipperHitTime < hitTime) { //!! >= 0.f causes infinite loop
			// 		hitTime = flipperHitTime;
			// 	}
			// }
			//console.log('updating in %sms (%sms)', hitTime, dtime)

			for (const mover of this.movers) {
				mover.updateDisplacements(hitTime);
			}

			dtime -= hitTime;
		}
	}

	public updatePhysics() {
		for (const mover of this.movers) {
			mover.updateVelocities();
		}
	}

	public addMover(mover: MoverObject) {
		this.movers.push(mover);
	}

	public addFlipperHit(flipperHit: FlipperHit) {
		this.flipperHits.push(flipperHit);
	}

	public setGravity(slopeDeg: number, strength: number): void {
		this.gravity.x = 0;
		this.gravity.y = Math.sin(degToRad(slopeDeg)) * strength;
		this.gravity.z = -Math.cos(degToRad(slopeDeg)) * strength;
	}
}
