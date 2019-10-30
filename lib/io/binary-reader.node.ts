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

import { close, open, read } from 'fs';
import { IBinaryReader } from './ole-doc';

export class NodeBinaryReader implements IBinaryReader {
	private readonly filename: string;
	private fd: number = 0;

	constructor(filename: string) {
		this.filename = filename;
	}

	public read(buffer: Buffer, offset: number, length: number, position: number): Promise<[number, Buffer]> {
		return new Promise((resolve, reject) => {
			read(this.fd, buffer, offset, length, position, (err, bytesRead, data) => {
				/* istanbul ignore if */
				if (err) {
					reject(err);
					return;
				}
				resolve([bytesRead, data]);
			});
		});
	}

	public async close(): Promise<void> {
		if (this.fd) {
			await new Promise((resolve, reject) => {
				close(this.fd, err => {
					if (err) {
						reject(err);
						return;
					}
					resolve();
				});
			});
		}
		this.fd = 0;
	}

	public async open(): Promise<void> {
		this.fd = await new Promise((resolve, reject) => {
			open(this.filename, 'r', 0o666, (err, fd) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(fd);
			});
		});
	}

	public isOpen(): boolean {
		return !!this.fd;
	}
}
