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
import { Dictionary } from './dictionary';
import { FileSystemObject } from './file-system-object';
import { VpmController } from './vpm-controller';
import { WshShell } from './wsh-shell';

export function getObject(name: string, player: Player): any {
	switch (name.toLowerCase()) {
		case 'scripting.dictionary': return new Dictionary();
		case 'scripting.filesystemobject': return new FileSystemObject();
		case 'vpinmame.controller': return new VpmController(player);
		case 'wscript.shell': return new WshShell();
	}
	ERR.Raise(429, undefined, "ActiveX component can't create object");
}
