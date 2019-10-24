import { Program } from 'estree';

export class Transformer {

	public static ITEMS_NAME = '__items';
	public static ENUMS_NAME = '__enums';
	public static GLOBAL_NAME = '__global';
	public static STDLIB_NAME = '__stdlib';
	public static VBSHELPER_NAME = '__vbsHelper';
	public static SCOPE_NAME = '__scope';

	protected readonly ast: Program;

	constructor(ast: Program) {
		this.ast = ast;
	}
}
