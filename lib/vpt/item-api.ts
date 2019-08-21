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

import { EventEmitter } from 'events';
import { Table } from './table/table';

export abstract class ItemApi extends EventEmitter {

	protected readonly table: Table;

	protected constructor(table: Table) {
		super();
		this.table = table;
	}

	protected assertNonHdrImage(imageName?: string) {
		const tex = this.table.getTexture(imageName);
		if (!tex) {
			throw new Error(`Texture "${imageName}" not found.`);
		}
		if (tex.isHdr()) {
			throw new Error(`Cannot use a HDR image (.exr/.hdr) here`);
		}
	}
}
