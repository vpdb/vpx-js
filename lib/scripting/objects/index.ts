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

import { Player } from '../../game/player';
import { ERR } from '../stdlib/err';
import { VbsProxyHandler } from '../vbs-proxy-handler';
import { Dictionary } from './dictionary';
import { FileSystemObject } from './file-system-object';
import { VpmController } from './vpm-controller';
import { WshShell } from './wsh-shell';

export function getObject<T>(name: string, player: Player): T | void {

	switch (name.toLowerCase()) {
		case 'scripting.dictionary':
			const dictionary = new Dictionary();
			return new Proxy(dictionary, new VbsProxyHandler(dictionary, Dictionary.prototype, true));

		case 'scripting.filesystemobject':
			const fso = new FileSystemObject();
			return new Proxy(fso, new VbsProxyHandler(fso, FileSystemObject.prototype, true));

		case 'vpinmame.controller':
			const vpc = new VpmController(player);
			return new Proxy(vpc, new VbsProxyHandler(vpc, VpmController.prototype, true));

		case 'wscript.shell':
			const wss = new WshShell();
			return new Proxy(wss, new VbsProxyHandler(wss, WshShell.prototype, true));
	}
	ERR.Raise(429, undefined, "ActiveX component can't create object");
}
