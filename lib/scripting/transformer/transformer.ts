import { BaseNode, Identifier, MemberExpression, Program } from 'estree';
import { inspect } from 'util';

export class Transformer {

	public static SCOPE_NAME = '__scope';
	public static ITEMS_NAME = '__items';
	public static ENUMS_NAME = '__enums';
	public static GLOBAL_NAME = '__global';
	public static STDLIB_NAME = '__stdlib';
	public static VBSHELPER_NAME = '__vbs';
	public static PLAYER_NAME = '__player';

	protected readonly ast: Program;

	constructor(ast: Program) {
		this.ast = ast;
	}

	protected isKnown(node: BaseNode, parent: BaseNode): boolean {
		return this.isKnownNode(node) || this.isKnownParent(parent);
	}

	protected isKnownNode(node: BaseNode) {
		if (node.type !== 'Identifier') {
			return false;
		}
		return [
			'eval',
			'Array',
			Transformer.PLAYER_NAME,
		].includes((node as Identifier).name);
	}

	protected isKnownParent(parent: BaseNode) {
		if (!parent) {
			return false;
		}
		if (parent.type !== 'MemberExpression') {
			return false;
		}
		return [
			Transformer.SCOPE_NAME,
			Transformer.ITEMS_NAME,
			Transformer.ENUMS_NAME,
			Transformer.GLOBAL_NAME,
			Transformer.STDLIB_NAME,
			Transformer.VBSHELPER_NAME,
			Transformer.PLAYER_NAME,
		].includes(this.getTopMemberName(parent as MemberExpression));
	}

	protected getTopMemberName(node: any): string {
		const obj = node.object as any;
		if (obj.type === 'MemberExpression') {
			return this.getTopMemberName(obj);
		}
		if (obj.type === 'Identifier') {
			return obj.name;
		}
		if (obj.type === 'CallExpression') {
			if (obj.callee.type === 'MemberExpression') {
				return this.getTopMemberName(obj.callee);
			}
			if (obj.callee.type === 'Identifier') {
				return obj.callee.name;
			}
			if (obj.callee.type === 'CallExpression') {
				return this.getTopMemberName(obj.callee.callee);
			}
			throw new Error(`Unknown callee type "${obj.callee.type}" when looking for top member name: ${inspect(obj, {depth: Infinity})}`);
		}
		if (obj.type === 'ThisExpression') {
			return 'this';
		}
		throw new Error(`Unknown node "${obj.type}" when looking for top member name.`);
	}
}
