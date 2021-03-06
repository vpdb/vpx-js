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

/**
 * The main purpose of this is to indicate in the UI that stuff is being
 * processed.
 *
 * This is currently only used for loading the table, but could be used
 * anywhere. Typically, calling `start` will pop up a progress dialog and
 * show what's going on.
 */
export class Progress implements IProgress {

	private currentTitle?: string;
	private currentAction?: string;

	private static instance: IProgress = new Progress();

	/**
	 * Get the global instance.
	 */
	public static progress(): IProgress {
		return Progress.instance;
	}

	/**
	 * Set a new global instance. The default instance, this class,
	 * just dumps it to the console.
	 * @param p
	 */
	public static setProgress(p: IProgress) {
		Progress.instance = p;
	}

	/**
	 * Indicate the beginning of a new major operation. This is typically the
	 * title of the progress dialog.
	 * @param id ID of the operation.
	 * @param title Displayed text
	 */
	public start(id: string, title: string): void {
		this.currentTitle = title;
	}

	/**
	 * Ends a previously started operation. All operation must end, otherwise
	 * the progress dialog won't hide!
	 * @param id ID of the operation
	 */
	public end(id: string): void {
	}

	/**
	 * Show what's currently going on. This is usually displayed on one line,
	 * where the action is left-aligned, and the details, if given, on the
	 * right.
	 *
	 * @param action Text to display on the left
	 * @param details Details on the right
	 */
	public show(action: string, details?: string): void {
		this.currentAction = action;
		this.print(details);
	}

	/**
	 * Show a new detail for the current action. This only updates the text
	 * on the "right" side.
	 * @param details Details on the right
	 */
	public details(details: string): void {
		this.print(details);
	}

	private print(details?: string) {
		logger().error('%s: %s%s', this.currentTitle, this.currentAction, details ? ' (' + details + ')' : '');
	}
}

export interface IProgress {
	start(id: string, title: string): void;
	end(id: string): void;
	show(action: string, details?: string): void;
	details(details: string): void;
}

export const logger = Logger.logger;
export const progress = Progress.progress;
