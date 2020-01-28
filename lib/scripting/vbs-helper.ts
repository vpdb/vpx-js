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

import { logger } from '../util/logger';
import { ERR, VbsError } from './stdlib/err';
import { Transpiler } from './transpiler';
import { VbsArray } from './vbs-array';
import { VbsUndefined } from './vbs-undefined';

export class VBSHelper {

	private static readonly UNDEFINED = new VbsUndefined();
	private readonly transpiler: Transpiler;
	private transpileCount = 0;

	constructor(transpiler: Transpiler) {
		this.transpiler = transpiler;
	}

	/**
	 * Recursive function to create a multi-dimension array.
	 */
	public dim(dimensions: number[], position: number = 0): any[] {
		const dimension = dimensions && dimensions.length ? dimensions[position] + 1 : 0;
		const array = new VbsArray(new Array(dimension).fill(VBSHelper.UNDEFINED));
		if (++position < dimensions.length) {
			for (let index = 0; index < dimension; index++) {
				array[index] = this.dim(dimensions, position);
			}
		}
		return array as unknown as any[];
	}

	/**
	 * Function to re-dimension an array and preserve values if requested.
	 */
	public redim(array: any[], dimensions: number[], preserve: boolean = false): any[] {
		let tmpArray = array;
		for (let index = 0; index < dimensions.length - 1; index++) {
			const dimension = dimensions[index] + 1;
			if (tmpArray.length !== dimension) {
				throw new Error('Only last dimension can be changed');
			}
			tmpArray = tmpArray[0];
		}
		if (!preserve) {
			return this.dim(dimensions);
		}
		return this.redimResize(array, dimensions);
	}

	public transpileInline(vbs: string, filename?: string) {
		// don't show oneliners in devtools
		let firstLine = '';
		if (filename) {
			firstLine = `//@ sourceURL=game:///${filename}.js\n`;
		} else if (vbs.length > 150) {
			firstLine = `//@ sourceURL=game:///inline${this.transpileCount++}.js\n`;
		}
		return firstLine + this.transpiler.transpile(vbs);
	}

	/**
	 * Recursive helper function to resize a multi-dimension array.
	 */
	private redimResize(array: any[], dimensions: number[], position: number = 0): any[] {
		const dimension = dimensions[position] + 1;
		if (position === dimensions.length - 1) {
			array.length = dimension;
		}
		if (++position < dimensions.length) {
			for (let index = 0; index < dimension; index++) {
				array[index] = this.redimResize(array[index], dimensions, position);
			}
		}
		return array;
	}

	/**
	 * Erase helper function to erase a multi-dimension array.
	 */
	public erase(array: any[]): any[] {
		const dimensions = [];
		for (;;) {
			dimensions.push(array.length - 1);
			if (!Array.isArray(array[0])) {
				break;
			}
			array = array[0];
		}
		return this.dim(dimensions);
	}

	/**
	 * Integer Division
	 */
	public intDiv(value1: number, value2: number): number {
		return Math.floor(Math.floor(value1) / Math.floor(value2));
	}

	/**
	 * Exponent
	 */
	public exponent(base: number, exponent: number): number {
		return Math.pow(base, exponent);
	}

	/**
	 * equals
	 */

	public equals(value1: any, value2: any): boolean {
		// tslint:disable-next-line:triple-equals
		if (value1 == value2) {
			return true;
		}

		const undef1 = typeof value1 === 'object' && value1.__isUndefined;
		const undef2 = typeof value2 === 'object' && value2.__isUndefined;

		// VbsUndefined == undefined
		if (undef1 && typeof value2 === 'undefined') {
			return true;
		}

		// undefined == VbsUndefined
		if (typeof value1 === 'undefined' && undef2) {
			return true;
		}

		// VbsUndefined == VbsUndefined
		if (undef1 && undef2) {
			return true;
		}

		// '' == VbsUndefined
		if (undef1 && value2 === '') {
			return true;
		}

		// VbsUndefined == ''
		if (value1 === '' && undef2) {
			return true;
		}

		return false;
	}

	/**
	 * is
	 */

	public is(value1: any, value2: any): boolean {
		return (value1 === value2);
	}

	public getOrCall(obj: any, ...params: any[]) {
		if (typeof obj === 'function') {
			// todo spread params if "own" api
			return obj.bind(obj)(params);
		}
		for (const param of params) {
			obj = obj[param];
		}
		return obj;
	}

	public getOrCallBound(parent: any, prop: string, ...params: number[]) {
		let obj = parent[prop];
		if (typeof obj === 'function') {
			if (parent.__isEngineApi) {
				return obj.bind(parent)(...params);
			} else {
				return obj.bind(parent)(params);
			}
		}
		for (const param of params) {
			obj = obj[param];
		}
		return obj;
	}

	public onErrorResumeNext() {
		ERR.OnErrorResumeNext();
	}

	public onErrorGoto(n: number) {
		if (n === 0) {
			ERR.OnErrorGoto0();
		} else {
			logger().warn('Cannot go to %s on error...', n);
		}
	}
}
