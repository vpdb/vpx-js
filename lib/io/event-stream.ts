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

const Stream = require('stream').Stream;
const immediately = global.setImmediate || process.nextTick;

export function readableStream<T>(func: (stream: any, i: number) => Promise<T | null>, continueOnError: boolean = false) {

	const stream = new Stream();
	let i = 0;
	let paused = false;
	let ended = false;
	let reading = false;

	stream.readable = true;
	stream.writable = false;

	stream.on('end', () => ended = true);

	function get(err?: Error, data: T | null = null) {

		if (err) {
			stream.emit('error', err);
			if (!continueOnError) {
				stream.emit('end');
			}
		} else if (arguments.length > 1) {
			stream.emit('data', data);
		}

		immediately(() => {
			if (ended || paused || reading) {
				return;
			}
			try {
				reading = true;
				func(stream, i++).then(buffer => {
					reading = false;
					get(undefined, buffer);

				}).catch(e => {
					stream.emit('error', e);
					stream.emit('end');
				});

			} catch (err) {
				stream.emit('error', err);
				stream.emit('end');
			}
		});
	}

	stream.resume = () => {
		paused = false;
		get();
	};
	process.nextTick(get);
	stream.pause = () => paused = true;
	stream.destroy = () => {
		stream.emit('end');
		stream.emit('close');
		ended = true;
	};
	return stream;
}
