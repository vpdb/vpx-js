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

import { FS } from './file-system';
import { TextStream } from './text-stream';

/**
 * Provides access to all the properties of a file.
 *
 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/file-object
 */
export class File {

	private readonly path: string;

	constructor(path: string) {
		this.path = path;
	}

	/**
	 * Opens a specified file and returns a TextStream object that can be used to read from, write to, or append to the file.
	 * @param mode Indicates input/output mode. Can be one of three constants: ForReading, ForWriting, or ForAppending.
	 * @param format One of three Tristate values used to indicate the format of the opened file. If omitted, the file is opened as ASCII.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/openastextstream-method
	 */
	public OpenAsTextStream(mode: number, tristate?: number): TextStream {
		return FS.getStream(this.path, mode);
	}
}
