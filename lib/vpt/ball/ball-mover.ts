import { MoverObject } from '../../physics/mover-object';
import { Ball } from './ball';

export class BallMover implements MoverObject {

	private pball: Ball;

	constructor(pball: Ball) {
		this.pball = pball;
	}

	public addToList(): boolean {
		return false;
	}

	public updateDisplacements(dtime: number): void {
		this.pball.UpdateDisplacements(dtime);
	}

	public updateVelocities(): void {
		this.pball.UpdateVelocities();
	}

}
