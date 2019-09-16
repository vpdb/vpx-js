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

import { EventProxy } from '../game/event-proxy';
import { ItemData } from './item-data';

/**
 * This is the base class of all table items.
 */
export abstract class Item<DATA extends ItemData> {

	protected readonly data: DATA;
	protected events?: EventProxy;

	protected constructor(data: DATA) {
		this.data = data;
	}

	public getName(): string {
		return this.data.getName();
	}

	public getEventProxy(): EventProxy {
		return this.events!;
	}

	protected getData(): DATA {
		return this.data;
	}
}
