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
 * This is a stub class for the registry. Maybe at some point we
 * can actually store user values here, but for now it just
 * returns the provided fallbacks.
 */
export class GlobalRegistry {

	private readonly registry = new Map<string, any>();

	public getRegStringAsFloat(key: string, value: string, fallback: number): number {
		return fallback;
	}

	public regRead(path: string): string | number | undefined {
		path = this.normalize(path);
		if (this.registry.has(path)) {
			return this.registry.get(path);
		}
		switch (path) {
			case 'hklm\\system\\controlset001\\control\\session manager\\environment\\processor_architecture': return 'AMD64';
			case 'hklm\\software\\microsoft\\windows nt\\currentversion\\currentversion': return 6.3;
			case 'hkcu\\software\\visual pinball\\controller\\forcedisableb2s': return 0;
			case 'hkcu\\software\\visual pinball\\controller\\dofcontactors': return 2;
			case 'hkcu\\software\\visual pinball\\controller\\dofknocker': return 2;
			case 'hkcu\\software\\visual pinball\\controller\\dofchimes': return 2;
			case 'hkcu\\software\\visual pinball\\controller\\dofbell': return 2;
			case 'hkcu\\software\\visual pinball\\controller\\dofgear': return 2;
			case 'hkcu\\software\\visual pinball\\controller\\dofshaker': return 2;
			case 'hkcu\\software\\visual pinball\\controller\\dofflippers': return 2;
			case 'hkcu\\software\\visual pinball\\controller\\doftargets': return 2;
			case 'hkcu\\software\\visual pinball\\controller\\dofdroptargets': return 2;
			case 'hkcu\\software\\freeware\\visual pinmame\\globals\\nvram_directory': return 'browser://vnrams/';
		}
	}

	public regWrite(key: string, value: any) {
		this.registry.set(this.normalize(key), value);
	}

	private normalize(path: string): string {
		path = path.replace('HKEY_CURRENT_USER\\', 'HKCU\\');
		path = path.replace('HKEY_CLASSES_ROOT\\', 'HKCR\\');
		path = path.replace('HKEY_LOCAL_MACHINE\\', 'HKLM\\');
		path = path.replace('HKEY_USERS\\', 'HKU\\');
		path = path.replace('HKEY_CURRENT_CONFIG\\', 'HKCC\\');
		return path.toLowerCase();
	}
}

export const registry = new GlobalRegistry();
