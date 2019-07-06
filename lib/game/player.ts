import { degToRad } from '../math/float';
import { Vertex3D } from '../math/vertex3d';

export class Player {

	private static instance: Player;

	public gravity = new Vertex3D();

	public static getInstance(): Player {
		if (!Player.instance) {
			Player.instance = new Player();
		}
		return Player.instance;
	}

	// tslint:disable-next-line:no-empty
	public PhysicsSimulateCycle(dtime: number) {

	}

	public setGravity(slopeDeg: number, strength: number): void {
		this.gravity.x = 0;
		this.gravity.y = Math.sin(degToRad(slopeDeg)) * strength;
		this.gravity.z = -Math.cos(degToRad(slopeDeg)) * strength;
	}
}
