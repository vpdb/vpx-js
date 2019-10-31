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

/**
 * Facilitates sequential access to file.
 *
 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/textstream-object
 */
export class TextStream {

	private readonly filename: string;
	private readonly unicode: boolean;

	constructor(filename: string, unicode: boolean) {
		this.filename = filename;
		this.unicode = unicode;
	}

	/**
	 * Read-only property that returns True if the file pointer immediately precedes the end-of-line marker in a TextStream file; False if it does not.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/atendofline-property
	 */
	public get AtEndOfLine() {
		// todo fs
		return true;
	}

	/**
	 * Read-only property that returns True if the file pointer is at the end of a TextStream file; False if it is not.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/atendofstream-property
	 */
	public get AtEndOfStream() {
		// todo fs
		return true;
	}

	/**
	 * Read-only property that returns the column number of the current character position in a TextStream file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/column-property-visual-basic-for-applications
	 */
	public get Column() {
		// todo fs
		return 0;
	}

	/**
	 * Read-only property that returns the current line number in a TextStream file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/line-property
	 */
	public get Line() {
		// todo fs
		return 0;
	}

	/**
	 * Closes an open TextStream file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/close-method-textstream-object
	 */
	public Close(): void {
		// todo fs
	}

	/**
	 * Reads a specified number of characters from a TextStream file and returns the resulting string.
	 * @param characters Number of characters that you want to read from the file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/read-method
	 */
	public Read(characters: number): string {
		// todo fs
		return '';
	}

	/**
	 * Reads an entire TextStream file and returns the resulting string.
	 * @see f
	 */
	public ReadAll(): string {
		// todo fs
		return '';
	}

	/**
	 * Reads an entire line (up to, but not including, the newline character) from a TextStream file and returns the resulting string.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/readline-method
	 */
	public ReadLine(): string {
		// todo fs
		return '';
	}

	/**
	 * Skips a specified number of characters when reading a TextStream file.
	 * @param characters Number of characters to skip when reading a file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/skip-method
	 */
	public Skip(characters: number): void {
		// todo fs
	}

	/**
	 * Skips the next line when reading a TextStream file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/skipline-method
	 */
	public SkipLine(): void {
		// todo fs
	}

	/**
	 * Writes a specified string to a TextStream file.
	 * @param data The text you want to write to the file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/write-method
	 */
	public Write(data: string): void {
		// todo fs
	}

	/**
	 * Writes a specified number of newline characters to a TextStream file.
	 * @param lines Number of newline characters you want to write to the file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/writeblanklines-method
	 */
	public WriteBlankLines(lines: number): void {
		// todo fs
	}

	/**
	 * Writes a specified string and newline character to a TextStream file.
	 * @param data The text you want to write to the file. If omitted, a newline character is written to the file.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/writeline-method
	 */
	public WriteLine(data: string): void {
		// todo fs
	}

	public setContent(textFile: string): this {
		// todo fs
		return this;
	}
}
