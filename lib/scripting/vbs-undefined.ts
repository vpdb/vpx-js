import { ERR } from './stdlib/err';

export class VbsUndefined implements ProxyHandler<any> {

	// tslint:disable-next-line:variable-name
	private readonly __errSet: Error;
	// tslint:disable-next-line:variable-name
	private readonly __errGet: Error;

	constructor(errSet: Error, errGet: Error) {
		this.__errSet = errSet;
		this.__errGet = errGet;
		return new Proxy(this, this);
	}

	public get(target: any, p: string | number | symbol, receiver: any): any {
		ERR.Raise(this.__errGet);
		return this;
	}

	public set(target: any, p: string | number | symbol, value: any, receiver: any): boolean {
		ERR.Raise(this.__errSet);
		return true;
	}
}
