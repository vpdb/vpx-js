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
 * Provides access to the collection of Windows environment variables.
 *
 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/6s7w15a0%28v%3dvs.84%29
 */
export class WshEnvironment {

	/**
	 * Exposes a specified item from a collection.
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/yzefkb42%28v%3dvs.84%29
	 */
	public Item: { [key: string ]: string } = {};

	/**
	 * Returns the number of Windows environment variables on the local computer system (the number of items in an Environment collection).
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/6kz722cz%28v%3dvs.84%29
	 */
	get length() { return Object.keys(this.Item).length; }

	/**
	 * Returns the number of members in an object.
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/6x47fysb%28v%3dvs.84%29
	 */
	public Count(): number {
		return this.length;
	}

	/**
	 * Removes an existing environment variable.
	 * @param strName String value indicating the name of the environment variable you want to remove.
	 * @see https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/windows-scripting/218yba97%28v%3dvs.84%29
	 */
	public Remove(strName: string): void {
		delete this.Item[strName];
	}

}

export const globalEnvironment = new WshEnvironment();
