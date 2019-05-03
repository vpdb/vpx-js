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

import { inflate } from 'zlib';
import { f4 } from '../math/float';
import { ReadResult } from './ole-doc';

/**
 * A class that comes with set of utilities for parsing the BIFF structure.
 */
export class BiffParser {

	public static stream(callback: OnBiffResult, opts: BiffStreamOptions = {}): (result: ReadResult) => Promise<number | null> {
		let nested: OnBiffResultStream<any> | null = null;
		let nestedItem: any = null;
		return async (result: ReadResult): Promise<number | null> => {
			const data = result.data;
			if (data.length < 4) {
				// todo why does this happen with example table?
				return null;
			}
			let len = data.readInt32LE(0);
			if (len > data.length - 4) {
				return -(len + 4);
			}
			let dataResult: Buffer;
			const tag = data.slice(4, 8).toString();
			let relStartPos = 8;
			let relEndPos = -4;

			if (opts.nestedTags && opts.nestedTags[tag]) {
				nested = opts.nestedTags[tag];
				nestedItem = nested.onStart();
				return len + 4;
			}

			if (opts.streamedTags && opts.streamedTags.includes(tag)) {
				len += data.readInt32LE(8) + 4;
				dataResult = Buffer.alloc(0);
				relStartPos += 4;
				relEndPos -= 4;
			} else {
				dataResult = data.slice(8, 8 + len - 4);
			}

			if (!tag || tag === 'ENDB') {
				if (nested) {
					nested.onEnd(nestedItem);
					nestedItem = null;
					nested = null;
					return len + 4;
				}
				return null;
			}
			const cb = nested ? nested.onTag(nestedItem) : callback;
			const skip = await cb(dataResult, tag, result.storageOffset + relStartPos, len + relEndPos);
			return (skip || len) + 4;
		};
	}

	public static async decompress(buffer: Buffer): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			inflate(buffer, (err, result) => {
				/* istanbul ignore if */
				if (err) {
					return reject(err);
				}
				resolve(result);
			});
		});
	}

	public static parseNullTerminatedString(buffer: Buffer, maxLength: number = 0) {
		if (maxLength) {
			buffer = buffer.slice(0, maxLength);
		}
		const nullBuffer = Buffer.from([0x0]);
		if (buffer.indexOf(nullBuffer) >= 0) {
			return buffer.slice(0, buffer.indexOf(nullBuffer)).toString('utf8');
		}
		return buffer.toString('utf8');
	}

	public static bgrToRgb(bgr: number) {
		/* tslint:disable:no-bitwise */
		const r = (bgr & 0xff) << 16;
		const g = bgr & 0xff00;
		const b = (bgr & 0xff0000) >> 16;
		/* tslint:enable:no-bitwise */
		return r + g + b;
	}

	protected getString(buffer: Buffer, len: number, dropIfNotAscii = false): string {
		const str = buffer.slice(4, len).toString('utf8');
		if (!dropIfNotAscii || this.isAscii(str)) {
			return str;
		}
		/* istanbul ignore next */
		return '';
	}

	protected getWideString(buffer: Buffer, len: number): string {
		const chars: number[] = [];
		buffer.slice(4, len).forEach((v, i) => {
			if (i % 2 === 0) {
				chars.push(v);
			}
		});
		return Buffer.from(chars).toString('utf8');
	}

	protected getInt(buffer: Buffer): number {
		return buffer.readInt32LE(0);
	}

	protected getFloat(buffer: Buffer): number {
		return f4(buffer.readFloatLE(0));
	}

	protected getBool(buffer: Buffer): boolean {
		return buffer.readInt32LE(0) > 0;
	}

	protected getUnsignedInt2s(buffer: Buffer, num: number): number[] {
		const intSize = 2;
		const ints: number[] = [];
		for (let i = 0; i < num; i++) {
			ints.push(buffer.readUInt16LE(i * intSize));
		}
		return ints;
	}

	protected getUnsignedInt4s(buffer: Buffer, num: number): number[] {
		const intSize = 4;
		const ints: number[] = [];
		for (let i = 0; i < num; i++) {
			ints.push(buffer.readUInt32LE(i * intSize));
		}
		return ints;
	}

	private isAscii(str: string): boolean {
		return /^[\x00-\x7F]*$/.test(str);
	}
}

/**
 * A function executed when a BIFF tag is read from the stream.
 */
export type OnBiffResult = (buffer: Buffer, tag: string, offset: number, len: number) => Promise<number>;

/**
 * Callbacks to provide to a nested BIFF stream.
 */
export interface OnBiffResultStream<T> {

	/**
	 * Run before the first tag is sent. What's returned is passed to [[onTag]]
	 * and [[onEnd]].
	 *
	 * This is used to instantiate the nested object that is going to be read.
	 */
	onStart: () => T;

	/**
	 * A tag was read.
	 * @param item The object created in [[onStart]].
	 */
	onTag: (item: T) => OnBiffResult;

	/**
	 * The nested tag has finished reading (and ENDV tag came along).
	 * @param item
	 */
	onEnd: (item: T) => void;
}

/**
 * Options to provide to a BIFF stream.
 */
export interface BiffStreamOptions {
	streamedTags?: string[];
	nestedTags?: { [key: string]: OnBiffResultStream<any> };
}
