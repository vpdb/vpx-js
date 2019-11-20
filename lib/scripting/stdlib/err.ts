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

import { VbsApi } from '../vbs-api';

/**
 * The global error object.
 *
 * @see https://docs.microsoft.com/en-us/dotnet/visual-basic/language-reference/statements/on-error-statement
 */
export class Err extends VbsApi {

	/**
	 * Returns or sets a numeric value specifying an error. Number is the Err object's default property. Read/write.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/number-property-visual-basic-for-applications
	 */
	public Number: number = 0;

	/**
	 * Returns or sets a string expression containing a descriptive string associated with an object. Read/write.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/description-property-visual-basic-for-applications
	 */
	public Description = '';

	/**
	 * Returns or sets a string expression specifying the name of the object or application that originally generated the error. Read/write.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/source-property-visual-basic-for-applications
	 */
	public Source = '';

	/**
	 * Returns or sets a string expression containing the context ID for a topic in a Help file. Read/write.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/helpcontext-property-visual-basic-for-applications
	 */
	public HelpContext = '';

	/**
	 * Returns or sets a string expression with the fully qualified path to a Help file. Read/write.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/helpfile-property
	 */
	public HelpFile = '';

	private doThrow = true;

	/**
	 * Generates a run-time error.
	 * @param codeOrError Error to be thrown
	 */
	public Raise(codeOrError: Error): void;
	/**
	 * Generates a run-time error.
	 * @param code Long integer that identifies the nature of the error. Visual Basic errors (both Visual Basic-defined and user-defined errors) are in the range 0–65535. The range 0–512 is reserved for system errors; the range 513–65535 is available for user-defined errors.
	 * @param source String expression naming the object or application that generated the error. When setting the Source property for an object, use the form project.class. If source is not specified, the programmatic ID of the current Visual Basic project is used.
	 * @param description String expression describing the error. If unspecified, the value in Number is examined. If it can be mapped to a Visual Basic run-time error code, the string that would be returned by the Error function is used as Description. If there is no Visual Basic error corresponding to Number, the "Application-defined or object-defined error" message is used.
	 * @param helpfile The fully qualified path to the Help file in which help on this error can be found. If unspecified, Visual Basic uses the fully qualified drive, path, and file name of the Visual Basic Help file.
	 * @param helpcontext The context ID identifying a topic within helpfile that provides help for the error. If omitted, the Visual Basic Help file context ID for the error corresponding to the Number property is used, if it exists
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/raise-method
	 */
	public Raise(code: number, source?: string, description?: string, helpfile?: string, helpcontext?: string): void;
	public Raise(codeOrError: number | Error, source: string = '', description: string = '', helpfile: string = '', helpcontext: string = ''): void {
		if (this.doThrow) {
			if (typeof codeOrError === 'number') {
				throw new Error(`Error ${codeOrError}: ${description}`);
			}
			throw codeOrError;
		}
		this.Number = typeof codeOrError === 'number' ? codeOrError : 0;
		this.Source = source;
		this.Description = description;
		this.HelpFile = helpfile;
		this.HelpContext = helpcontext;
	}

	/**
	 * Clears all property settings of the Err object.
	 * @see https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/clear-method-visual-basic-for-applications
	 */
	public Clear() {
		this.Number = 0;
		this.Description = '';
		this.Source = '';
		this.Description = '';
		this.HelpFile = '';
		this.HelpContext = '';
	}

	public OnErrorGoto0(): void {
		this.doThrow = true;
	}

	public OnErrorResumeNext(): void {
		this.doThrow = false;
	}

	public valueOf() {
		return this.Number;
	}

	protected _getPropertyNames(): string[] {
		return Object.getOwnPropertyNames(Err.prototype);
	}
}

export const ERR = new Err();
