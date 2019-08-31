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

import { BiffParser } from '../io/biff-parser';
import { logger } from '../util/logger';

/**
 * A binary usually contains image data for a texture.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/pinbinary.cpp
 */
export class Binary extends BiffParser {

	public szName!: string;
	public szInternalName!: string;
	public szPath!: string;
	public cdata!: number;
	public pos!: number;
	public len!: number;

	public async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'NAME': this.szName = this.getString(buffer, len); break;
			case 'INME': this.szInternalName = this.getString(buffer, len); break;
			case 'PATH': this.szPath = this.getString(buffer, len); break;
			case 'SIZE': this.cdata = this.getInt(buffer); break;
			case 'DATA':
				this.pos = offset;
				this.len = len;
				break;
			/* istanbul ignore next */
			default: logger().warn('[Binary.fromTag] Unknown tag "%s".', tag);
		}
		return 0;
	}
}
