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

export class FrameData {
	public frameVerts: VertData[] = [];

	public static get(buffer: Buffer, numVertices: number): FrameData {
		const frameData = new FrameData();
		for (let i = 0; i < numVertices; i++) {
			frameData.frameVerts.push(VertData.load(buffer, i * 24));
		}
		return frameData;
	}

	public clone(): FrameData {
		const frameData = new FrameData();
		frameData.frameVerts = this.frameVerts.map(v => v.clone());
		return frameData;
	}
}

export class VertData {
	public readonly x: number;
	public readonly y: number;
	public readonly z: number;

	public readonly nx: number;
	public readonly ny: number;
	public readonly nz: number;

	constructor(x: number, y: number, z: number, nx: number, ny: number, nz: number) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.nx = nx;
		this.ny = ny;
		this.nz = nz;
	}

	public static load(buffer: Buffer, offset: number = 0): VertData {
		return new VertData(
			buffer.readFloatLE(offset),
			buffer.readFloatLE(offset + 4),
			buffer.readFloatLE(offset + 8),
			buffer.readFloatLE(offset + 12),
			buffer.readFloatLE(offset + 16),
			buffer.readFloatLE(offset + 20),
		);
	}

	public clone(): VertData {
		return new VertData(this.x, this.y, this.z, this.nx, this.ny, this.nz);
	}
}
