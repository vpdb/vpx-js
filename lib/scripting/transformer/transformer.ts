import { traverse } from 'estraverse';
import { BaseNode, Identifier, MemberExpression, Program } from 'estree';
import { inspect } from 'util';
import { logger } from '../../util/logger';

const { analyze } = require('escope');

export class Transformer {

	public static SCOPE_NAME = '__scope';
	public static ITEMS_NAME = '__items';
	public static ENUMS_NAME = '__enums';
	public static GLOBAL_NAME = '__global';
	public static STDLIB_NAME = '__stdlib';
	public static VBSHELPER_NAME = '__vbs';
	public static PLAYER_NAME = '__player';

	protected readonly ast: Program;

	private readonly scopeManager: any;
	protected readonly rootScope: any;

	constructor(ast: Program, analyzeScope = false) {
		this.ast = ast;
		if (analyzeScope) {
			this.scopeManager = analyze(ast);
			this.rootScope = this.scopeManager.acquire(ast);
		}
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

	protected isLocalVariable(node: any): boolean {
		if (!node.name) {
			return false;
		}
		if (!node.__scope) {
			throw new Error('No scope to check!');
		}
		return !!node.__scope.variables.find( (v: any) => v.name.toLowerCase() === node.name.toLowerCase());
	}

	/**
	 * Using `escope`, we acquire the current scope for each node and attach it
	 * to the node for later usage.
	 *
	 * This is a separate run because it's done when *leaving* the node.
	 */
	protected addScope(): void {

		/* istanbul ignore next */
		if (!this.rootScope) {
			throw new Error('Need to instantiate with analyzeScope = true when using addScope!');
		}
		let ignoreClass = false;
		let currentScope = this.rootScope;
		traverse(this.ast, {
			enter: node => {
				if (!ignoreClass) {
					if (node.type.startsWith('Class')) {
						ignoreClass = true;
					} else {
						(node as any).__scope = currentScope;
						if (/Function/.test(node.type)) {
							currentScope = this.scopeManager.acquire(node);
						}
					}
				}
			},
			leave: node => {
				if (node.type.startsWith('Class')) {
					ignoreClass = false;
				} else {
					if (!ignoreClass) {
						if (/Function/.test(node.type)) {
							currentScope = currentScope.upper;
						}
					}
				}
			},
		});
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
