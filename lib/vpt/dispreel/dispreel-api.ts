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

import { MAX_REELS } from '../../physics/constants';
import { ItemApi } from '../item-api';
import { DispReelData } from './dispreel-data';

export class DispReelApi extends ItemApi<DispReelData> {

	get BackColor() { return this.data.backColor; }
	set BackColor(v) { this.data.backColor = v; }
	get Reels() { return this.data.reelCount; }
	set Reels(v) {
		this.data.reelCount = Math.min(Math.max(1, v), MAX_REELS); // must have at least 1 reel and a max of MAX_REELS
		this.data.v2.x = this.data.v1.x + this.data.getBoxWidth();
		this.data.v2.y = this.data.v1.y + this.data.getBoxHeight();
	}
	get Width() { return this.data.width; }
	set Width(v) {
		this.data.width = Math.max(0.0, v);
		this.data.v2.x = this.data.v1.x + this.data.getBoxWidth();
	}
	get Height() { return this.data.height; }
	set Height(v) {
		this.data.height = Math.max(0.0, v);
		this.data.v2.y = this.data.v1.y + this.data.getBoxHeight();
	}
	get X() { return this.data.v1.x; }
	set X(v) {
		const delta = v - this.data.v1.x;
		this.data.v1.x += delta;
		this.data.v2.x = this.data.v1.x + this.data.getBoxWidth();
	}
	get Y() { return this.data.v1.y; }
	set Y(v) {
		const delta = v - this.data.v1.y;
		this.data.v1.y += delta;
		this.data.v2.y = this.data.v1.y + this.data.getBoxHeight();
	}
	get IsTransparent() { return this.data.isTransparent; }
	set IsTransparent(v) { this.data.isTransparent = v; }
	get Image() { return this.data.szImage; }
	set Image(v) { this._assertNonHdrImage(v); this.data.szImage = v; }
	get Spacing() { return this.data.reelSpacing; }
	set Spacing(v) { this.data.reelSpacing = v; }
	get Sound() { return this.data.szSound; }
	set Sound(v) { this.data.szSound = v; }
	get Steps() { return this.data.motorSteps; }
	set Steps(v) { this.data.motorSteps = Math.max(1, v); }
	get Range() { return this.data.digitRange; }
	set Range(v) {
		this.data.digitRange = Math.max(0, v);      // must have at least 1 digit (0 is a digit)
		if (this.data.digitRange > 512 - 1) {
			this.data.digitRange = 512 - 1;                // and a max of 512 (0->511) //!! 512 requested by highrise
		}
	}
	get UpdateInterval() { return this.data.updateInterval; }
	set UpdateInterval(v) { this.data.updateInterval = Math.max(5, v); }
	get UseImageGrid() { return this.data.useImageGrid; }
	set UseImageGrid(v) { this.data.useImageGrid = v; }
	get Visible() { return this.data.isVisible; }
	set Visible(v) { this.data.isVisible = v; }
	get ImagesPerGridRow() { return this.data.imagesPerGridRow; }
	set ImagesPerGridRow(v) { this.data.imagesPerGridRow = v; }

	public AddValue(value: number): void {
		// TODO implement
	}

	public SetValue(value: number): void {
		// TODO implement
	}

	public ResetToZero(): void {
		// TODO implement
	}

	public SpinReel(reelNumber: number, pulseCount: number): void {
		// TODO implement
	}

	protected _getPropertyNames(): string[] {
		return Object.getOwnPropertyNames(DispReelApi.prototype);
	}
}
