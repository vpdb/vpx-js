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

import { ERR } from '../stdlib/err';
import { VbsNotImplementedError } from '../vbs-api';

/**
 * Facilitates sequential access to file.
 *
 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/textstream-object
 */
export class TextStream {

	public static readonly MODE_READ = 1;
	public static readonly MODE_WRITE = 2;
	public static readonly MODE_APPEND = 8;

	private readonly filename: string;
	private readonly unicode: boolean;

	private buffer: Buffer = Buffer.alloc(0);
	private cursor: number = -1;
	private mode: number;

	constructor(filename: string, unicode: boolean, mode: number) {
		this.filename = filename;
		this.unicode = unicode;
		this.mode = mode;
	}

	/**
	 * Read-only property that returns True if the file pointer immediately precedes the end-of-line marker in a TextStream file; False if it does not.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/atendofline-property
	 */
	public get AtEndOfLine() {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Read-only property that returns True if the file pointer is at the end of a TextStream file; False if it is not.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/atendofstream-property
	 */
	public get AtEndOfStream(): boolean {
		return this.cursor === this.buffer.length - 1;
	}

	/**
	 * Read-only property that returns the column number of the current character position in a TextStream file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/column-property-visual-basic-for-applications
	 */
	public get Column() {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Read-only property that returns the current line number in a TextStream file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/line-property
	 */
	public get Line() {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Closes an open TextStream file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/close-method-textstream-object
	 */
	public Close(): void {
		this.cursor = 0;
		// no file, nothing to close
	}

	/**
	 * Reads a specified number of characters from a TextStream file and returns the resulting string.
	 * @param characters Number of characters that you want to read from the file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/read-method
	 */
	public Read(characters: number): string | void {
		if (this.mode !== TextStream.MODE_READ) {
			return ERR.Raise(54, undefined, 'Bad file mode');
		}
		return this.buffer.slice(this.cursor, this.cursor + characters).toString(this.unicode ? 'utf8' : 'ascii');
	}

	/**
	 * Reads an entire TextStream file and returns the resulting string.
	 * @see f
	 */
	public ReadAll(): string | void {
		if (this.mode !== TextStream.MODE_READ) {
			return ERR.Raise(54, undefined, 'Bad file mode');
		}
		return this.buffer.toString(this.unicode ? 'utf8' : 'ascii');
	}

	/**
	 * Reads an entire line (up to, but not including, the newline character) from a TextStream file and returns the resulting string.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/readline-method
	 */
	public ReadLine(): string | void {
		if (this.mode !== TextStream.MODE_READ) {
			return ERR.Raise(54, undefined, 'Bad file mode');
		}
		const start = this.cursor;
		let end = this.cursor;
		do {
			this.cursor++;
			end++;
			if (this.buffer[this.cursor] === 0x0d) {
				if (this.cursor < this.buffer.length - 2 && this.buffer[this.cursor + 1] === 0x0a) {
					this.cursor++;
				}
				this.cursor++;
				end--;
				break;
			}
		} while (this.cursor < this.buffer.length - 1);
		return this.buffer.slice(start, end + 1).toString(this.unicode ? 'utf8' : 'ascii');
	}

	/**
	 * Skips a specified number of characters when reading a TextStream file.
	 * @param characters Number of characters to skip when reading a file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/skip-method
	 */
	public Skip(characters: number): void {
		if (this.mode !== TextStream.MODE_READ) {
			return ERR.Raise(54, undefined, 'Bad file mode');
		}
		this.cursor += characters;
		this.clampCursor();
	}

	/**
	 * Skips the next line when reading a TextStream file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/skipline-method
	 */
	public SkipLine(): void {
		if (this.mode !== TextStream.MODE_READ) {
			return ERR.Raise(54, undefined, 'Bad file mode');
		}
		do {
			this.cursor++;
			if (this.buffer[this.cursor] === 0x0d) {
				if (this.cursor < this.buffer.length - 2 && this.buffer[this.cursor + 1] === 0x0a) {
					this.cursor++;
				}
				this.cursor++;
				return;
			}
		} while (this.cursor < this.buffer.length - 1);
	}

	/**
	 * Writes a specified string to a TextStream file.
	 * @param data The text you want to write to the file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/write-method
	 */
	public Write(data: string): void {
		this.buffer = Buffer.concat([this.buffer, Buffer.from(data) ]);
		this.cursorToEnd();
	}

	/**
	 * Writes a specified number of newline characters to a TextStream file.
	 * @param lines Number of newline characters you want to write to the file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/writeblanklines-method
	 */
	public WriteBlankLines(lines: number): void {
		// no usages found
		throw new VbsNotImplementedError();
	}

	/**
	 * Writes a specified string and newline character to a TextStream file.
	 * @param data The text you want to write to the file. If omitted, a newline character is written to the file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/writeline-method
	 */
	public WriteLine(data: string): void {
		this.Write(data + '\r\n');
	}

	public setContent(data: string): this {
		this.buffer = Buffer.from(data);
		this.cursorToEnd();
		return this;
	}

	public setMode(mode: number): this {
		this.mode = mode;
		return this;
	}

	private clampCursor() {
		this.cursor = Math.min(Math.max(-1, this.cursor), this.buffer.length - 1);
	}

	private cursorToEnd() {
		this.cursor = this.buffer.length - 1;
	}

	public cursorToStart(): this {
		this.cursor = 0;
		return this;
	}
}
