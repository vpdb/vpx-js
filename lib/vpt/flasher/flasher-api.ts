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

import { Filters } from '../enums';
import { ItemApi } from '../item-api';
import { FlasherData } from './flasher-data';

export class FlasherApi extends ItemApi<FlasherData> {

	get X() { return this.data.center.x; }
	set X(v) { this.data.center.x = v; }
	get Y() { return this.data.center.y; }
	set Y(v) { this.data.center.y = v; }
	get RotX() { return this.data.rotX; }
	set RotX(v) { this.data.rotX = v; }
	get RotY() { return this.data.rotY; }
	set RotY(v) { this.data.rotY = v; }
	get RotZ() { return this.data.rotZ; }
	set RotZ(v) { this.data.rotZ = v; }
	get Height() { return this.data.height; }
	set Height(v) { this.data.height = v; }
	get Color() { return this.data.color; }
	set Color(v) { this.data.color = v; }
	get ImageA() { return this.data.szImageA; }
	set ImageA(v) { this.data.szImageA = v; }
	get ImageB() { return this.data.szImageB; }
	set ImageB(v) { this.data.szImageB = v; }
	get Filter() { return filterToName(this.data.filter); }
	set Filter(v) { this.data.filter = nameToFilter(v); }
	get Opacity() { return this.data.alpha; }
	set Opacity(v) { this.data.alpha = Math.max(0, v); }
	get IntensityScale() { return this.data.intensityScale; }
	set IntensityScale(v) { this.data.intensityScale = v; }
	get ModulateVsAdd() { return this.data.modulateVsAdd; }
	set ModulateVsAdd(v) { this.data.modulateVsAdd = v; }
	get Amount() { return this.data.filterAmount; }
	set Amount(v) { this.data.filterAmount = Math.max(0, v); }
	get Visible() { return this.data.isVisible; }
	set Visible(v) { this.data.isVisible = v; }
	get DisplayTexture() { return this.data.displayTexture; }
	set DisplayTexture(v) { this.data.displayTexture = v; }
	get AddBlend() { return this.data.addBlend; }
	set AddBlend(v) { this.data.addBlend = v; }
	get DMD() { return this.data.isDMD; }
	set DMD(v) { this.data.isDMD = v; }
	get DepthBias() { return this.data.depthBias; }
	set DepthBias(v) { this.data.depthBias = v; }
	get ImageAlignment() { return this.data.imageAlignment; }
	set ImageAlignment(v) { this.data.imageAlignment = v; }

	/**
	 * No idea wtf this is supposed to do.
	 */
	public InterfaceSupportsErrorInfo(riid: any): boolean {
		return false;
	}
}

function filterToName(filter: number): string {
	switch (filter) {
		case Filters.Filter_Additive: return 'Additive';
		case Filters.Filter_Multiply: return 'Multiply';
		case Filters.Filter_Screen: return 'Screen';
		case Filters.Filter_None: return 'None';
	}
	return 'None';
}

function nameToFilter(name?: string): number {
	switch ((name || '').toLowerCase()) {
		case 'additive': return Filters.Filter_Additive;
		case 'multiply': return Filters.Filter_Multiply;
		case 'screen': return Filters.Filter_Screen;
		case 'none': return Filters.Filter_None;
	}
	return Filters.Filter_None;
}
