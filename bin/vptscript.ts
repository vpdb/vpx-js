#!/usr/bin/env node
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

import { existsSync } from 'fs';
import { resolve } from 'path';
import { NodeBinaryReader } from '../lib/io/binary-reader.node';
import { Table } from '../lib/vpt/table/table';

(async () => {

	try {

		const argSrc = process.argv[2];
		if (!argSrc) {
			console.log('Prints the table script of a Visual Pinball table.\n\nUSAGE: vptscript <source.vpx>\n');
			return;
		}
		if (!/\.vp[xt]$/i.test(argSrc)) {
			throw new Error('First argument must be a .vpx or .vpt file.');
		}
		const vpxPath = resolve(argSrc);
		if (!existsSync(vpxPath)) {
			throw new Error(`The file "${vpxPath}" does not exist.`);
		}

		const vpt = await Table.load(new NodeBinaryReader(vpxPath), { loadTableScript: true });
		console.log(vpt.getTableScript());

	} catch (err) {
		console.error(`ERROR: ${err.message}`);

	} finally {
		process.exit();
	}

})();
