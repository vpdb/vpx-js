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

import { ItemApi } from '../item-api';
import { DecalData } from './decal-data';

export class DecalApi extends ItemApi<DecalData> {

	get Rotation() { return this.data.rotation; }
	set Rotation(v) { this.data.rotation = v; }
	get Image() { return this.data.szImage; }
	set Image(v) { this._assertNonHdrImage(v); this.data.szImage = v; }
	get Width() { return this.data.width; }
	set Width(v) { this.data.width = v; }
	get Height() { return this.data.height; }
	set Height(v) { this.data.height = v; }
	get X() { return this.data.center.x; }
	set X(v) { this.data.center.x = v; }
	get Y() { return this.data.center.y; }
	set Y(v) { this.data.center.y = v; }
	get Surface() { return this.data.szSurface; }
	set Surface(v) { this.data.szSurface = v; }
	get Type() { return this.data.decalType; }
	set Type(v) { this.data.decalType = v; }
	get Text() { return this.data.text; }
	set Text(v) { this.data.text = v; }
	get SizingType() { return this.data.sizingType; }
	set SizingType(v) { this.data.sizingType = v; }
	get FontColor() { return this.data.color; }
	set FontColor(v) { this.data.color = v; }
	get Material() { return this.data.szMaterial; }
	set Material(v) { this.data.szMaterial = v; }
	get Font() { return this.data.font; }
	set Font(v) { this.data.font = v; }
	get HasVerticalText() { return this.data.verticalText; }
	set HasVerticalText(v) { this.data.verticalText = v; }

}
