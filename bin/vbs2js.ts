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
import { Grammar } from '../lib/scripting/grammar/grammar';
import { Progress } from '../lib';

/* tslint:disable: no-console */
(() => {

	try {
		const grammar = new Grammar();
		const argVbs = process.argv[2];
		const formatOnly = (process.argv[3] === '--format-only');

		// mute progress logs
		Progress.setProgress({
			details(details: string): void { },
			end(id: string): void { },
			show(action: string, details?: string): void { },
			start(id: string, title: string): void { },
		});

		if (!argVbs) {
			throw new Error('USAGE: vbs2js <script.vbs> --format-only');
		}

		if (!existsSync(argVbs)) {
			throw new Error(`Cannot find "${argVbs}".`);
		}

		const vbs = readFileSync(argVbs).toString();

		if (!formatOnly) {
			console.log(grammar.vbsToJs(vbs));
		} else {
			console.log(grammar.format(vbs));
		}
	} catch (err) {
		console.error(err);

	} finally {
		process.exit();
	}

})();
