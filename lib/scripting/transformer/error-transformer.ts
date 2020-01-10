import { replace } from 'estraverse';
import { Program } from 'estree';
import {
	identifier,
	memberExpression,
} from '../estree';
import { Transformer } from './transformer';

export class ErrorTransformer extends Transformer {

	constructor(ast: Program) {
		super(ast);
	}

	public transform(): Program {
		return replace(this.ast, {
			enter: (node, parent: any) => {
				if (node.type === 'Identifier' && node.name === 'Err' && parent &&
					(parent.type === 'IfStatement' || parent.type === 'LogicalExpression')) {
					return memberExpression(node, identifier('Number'));
				}
			},
		}) as Program;
	}
}
