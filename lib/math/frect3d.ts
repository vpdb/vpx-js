import { FLT_MAX } from '../vpt/mesh';
import { Vertex3D } from './vertex3d';

export class FRect3D {

	public left: number = 0;
	public top: number = 0;
	public right: number = 0;
	public bottom: number = 0;
	public zlow: number = 0;
	public zhigh: number = 0;

	constructor(left?: number, right?: number, top?: number, bottom?: number, zLow?: number, zHigh?: number) {
		if (left !== undefined && right !== undefined && top !== undefined && bottom !== undefined  && zLow !== undefined  && zHigh !== undefined ) {
			this.left = left;
			this.right = right;
			this.top = top;
			this.bottom = bottom;
			this.zlow = zLow;
			this.zhigh = zHigh;
		} else {
			this.Clear();
		}
	}

	public Clear(): void {
		this.left = FLT_MAX;
		this.right = -FLT_MAX;
		this.top = FLT_MAX;
		this.bottom = -FLT_MAX;
		this.zlow = FLT_MAX;
		this.zhigh = -FLT_MAX;
	}

	public extend(other: FRect3D): void {
		this.left = Math.min(this.left, other.left);
		this.right = Math.max(this.right, other.right);
		this.top = Math.min(this.top, other.top);
		this.bottom = Math.max(this.bottom, other.bottom);
		this.zlow = Math.min(this.zlow, other.zlow);
		this.zhigh = Math.max(this.zhigh, other.zhigh);
	}

	public intersectSphere(sphereP: Vertex3D, sphereRsqr: number): boolean {
		let ex = Math.max(this.left - sphereP.x, 0) + Math.max(sphereP.x - this.right, 0);
		let ey = Math.max(this.top - sphereP.y, 0) + Math.max(sphereP.y - this.bottom, 0);
		let ez = Math.max(this.zlow - sphereP.z, 0) + Math.max(sphereP.z - this.zhigh, 0);
		ex *= ex;
		ey *= ey;
		ez *= ez;
		return ex + ey + ez <= sphereRsqr;
	}

	public intersectRect(rc: FRect3D): boolean {
		return this.right >= rc.left
			&& this.bottom >= rc.top
			&& this.left <= rc.right
			&& this.top <= rc.bottom
			&& this.zlow <= rc.zhigh
			&& this.zhigh >= rc.zlow;
	}
}
