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

export const VP_VERSION_MAJOR = 10; // X Digits
export const VP_VERSION_MINOR = 6;  // Max 2 Digits
export const VP_VERSION_REV = 0;  // Max 1 Digit

export { Table } from './vpt/table/table';
export { Player } from './game/player';
export { OleCompoundDoc, Storage } from './io/ole-doc';
export { BrowserBinaryReader } from './io/binary-reader.browser';
export { Logger, Progress, progress } from './util/logger';
export { Ball } from './vpt/ball/ball';
export { ThreeRenderApi } from './render/threejs/three-render-api';
export { ThreeTextureLoader } from './refs.node';
export { SoundAdapter } from './refs.node';
