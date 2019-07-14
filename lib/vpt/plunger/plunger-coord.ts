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

/**
 * Plunger shape descriptor coordinate entry.
 *
 * The plunger is essentially built on a virtual lathe:  it consists of a series
 * of circles centered on the longitudinal axis.  Each coordinate gives the
 * position along the axis of the circle, expressed as the distance (in
 * standard table units) from the tip, and the radius of the circle, expressed
 * as a fraction of the nominal plunger width (m_d.m_width).  Each coordinate
 * also specifies the normal for the vertices along that circle, and the
 * vertical texture offset of the vertices.  The horizontal texture offset is
 * inferred in the lathing process - the center of the texture is mapped to the
 * top center of each circle, and the texture is wrapped around the sides of
 * the circle.
 */
export class PlungerCoord {

	/**
	 * radius at this point, as a fraction of nominal plunger width
	 */
	public r: number;

	/**
	 * y position, in table distance units, with the tip at 0.0
	 */
	public y: number;

	/**
	 * texture v coordinate of the vertices on this circle
	 */
	public tv: number;

	/**
	 * normal of the top vertex along this circle
	 */
	public nx: number;
	public ny: number;

	constructor(r: number, y: number, tv: number, nx: number, ny: number) {
		this.r  = r;
		this.y  = y;
		this.tv = tv;
		this.nx = nx;
		this.ny = ny;
	}

	public set(r: number, y: number, tv: number, nx: number, ny: number) {
		this.r  = r;
		this.y  = y;
		this.tv = tv;
		this.nx = nx;
		this.ny = ny;
	}
}
