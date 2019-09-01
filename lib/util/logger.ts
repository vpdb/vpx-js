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

/* tslint:disable:no-empty no-console */
export class Logger implements ILogger {

	private static instance: ILogger = new Logger();

	public static logger(): ILogger {
		return Logger.instance;
	}

	public static setLogger(l: ILogger) {
		Logger.instance = l;
	}

	public debug(format: any, ...param: any[]): void {
		console.debug.apply(console.log, [ format, ...param ]);
	}

	public error(format: any, ...param: any[]): void {
		console.error.apply(console.log, [ format, ...param ]);
	}

	public info(format: any, ...param: any[]): void {
		console.log.apply(console.log, [ format, ...param ]);
	}

	public verbose(format: any, ...param: any[]): void {
		console.debug.apply(console.log, [ format, ...param ]);
	}

	public warn(format: any, ...param: any[]): void {
		console.warn.apply(console.log, [ format, ...param ]);
	}

	public wtf(format: any, ...param: any[]): void {
		console.error.apply(console.log, [ format, ...param ]);
	}
}

export interface ILogger {
	wtf(format: any, ...param: any[]): void;

	error(format: any, ...param: any[]): void;

	warn(format: any, ...param: any[]): void;

	info(format: any, ...param: any[]): void;

	verbose(format: any, ...param: any[]): void;

	debug(format: any, ...param: any[]): void;
}

export const logger = Logger.logger;
