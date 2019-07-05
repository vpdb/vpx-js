import { Vertex3D } from '../math/vertex3d';
import { degToRad } from '../math/float';

export class Player {

	private static instance: Player;

	public gravity = new Vertex3D();

	public static getInstance(): Player {
		if (!Player.instance) {
			Player.instance = new Player();
		}
		return Player.instance;
	}

	public setGravity(slopeDeg: number, strength: number): void {
		this.gravity.x = 0;
		this.gravity.y = Math.sin(degToRad(slopeDeg)) * strength;
		this.gravity.z = -Math.cos(degToRad(slopeDeg)) * strength;
	}
}
