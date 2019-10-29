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

import controller from '../../../res/scripts/controller.vbs';
import core from '../../../res/scripts/core.vbs';
import VPMKeys from '../../../res/scripts/VPMKeys.vbs';
import WPC from '../../../res/scripts/WPC.vbs';

export function getTextFile(fileName: string) {
	switch (fileName.toLowerCase()) {
		case 'controller.vbs': return controller;
		case 'core.vbs': return core;
		case 'vpmkeys.vbs': return VPMKeys;
		case 'wpc.vbs': return WPC;
	}
	throw new Error(`Cannot find text file ${fileName}`);
}
