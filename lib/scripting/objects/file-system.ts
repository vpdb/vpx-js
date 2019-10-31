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

import { getTextFile } from '../../refs.node';
import { TextStream } from './text-stream';

export class FileSystem {

	private readonly files = new Map<string, TextStream>();

	public addStream(fileName: string, stream: TextStream): TextStream {
		this.files.set(this.normalizePath(fileName), stream);
		return stream;
	}

	public getStream(fileName: string): TextStream {
		if (!this.files.has(this.normalizePath(fileName))) {
			return new TextStream(fileName, true).setContent(getTextFile(fileName));
		}
		return this.files.get(this.normalizePath(fileName))!;
	}

	public deleteFile(fileName: string) {
		this.files.delete(this.normalizePath(fileName));
	}

	public fileExists(fileName: string) {
		if (this.files.has(this.normalizePath(fileName))) {
			return true;
		}
		try {
			getTextFile(fileName);
			return true;
		} catch {
			return false;
		}
	}

	public folderExists(folderName: string) {
		const f = this.normalizePath(folderName);
		for (const fileName of this.files.keys()) {
			if (fileName.startsWith(f)) {
				return true;
			}
		}
		return false;
	}

	public clearAll() {
		this.files.clear();
	}

	private normalizePath(path: string): string {
		return path.replace(/\\+/g, '/').toLowerCase();
	}
}

export const FS = new FileSystem();
