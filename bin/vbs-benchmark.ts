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

import { existsSync, readFileSync } from 'fs';
import { Player, Progress } from '../lib';
import { Transpiler } from '../lib/scripting/transpiler';
import { logger } from '../lib/util/logger';
import { TableBuilder } from '../test/table-builder';

/* tslint:disable: no-console */
(() => {

	try {
		const argVbs = process.argv[2];

		// mute progress logs
		Progress.setProgress({
			details(details: string): void { /* do nothing */ },
			end(id: string): void { /* do nothing */ },
			show(action: string, details?: string): void { /* do nothing */ },
			start(id: string, title: string): void { /* do nothing */ },
		});
		logger().debug = () => { /* do nothing */ };

		if (!argVbs) {
			throw new Error('USAGE: vbs-benchmark <script.vbs>');
		}

		if (!existsSync(argVbs)) {
			throw new Error(`Cannot find "${argVbs}".`);
		}

		const vbs = readFileSync(argVbs).toString();
		const table = new TableBuilder().build();
		const player = new Player(table).init();

		const transpiler = new Transpiler(table, player);
		transpiler.transpile(vbs);

	} catch (err) {
		console.error(err);

	} finally {
		process.exit();
	}

})();
