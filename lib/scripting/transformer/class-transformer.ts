import { replace } from 'estraverse';
import { MethodDefinition, Program, ReturnStatement } from 'estree';
import {
	arrowFunctionExpression,
	callExpression,
	identifier,
	memberExpression,
	newExpression,
	objectExpression,
	property,
	returnStatement,
	thisExpression,
} from '../estree';
import { Transformer } from './transformer';

export class ClassTransformer extends Transformer {

	constructor(ast: Program) {
		super(ast);
	}

	public transform(): Program {
		return replace(this.ast, {
			enter: (node, parent: any) => {

				// inject proxy into constructor
				if (node.type === 'ClassBody') {
					const ctr = node.body.find(m => m.kind === 'constructor') as MethodDefinition;
					ctr.value.body.body.push(proxyReturnStatement());
				}

				// make method declarations lower case
				if (node.type === 'MethodDefinition' && node.key.type === 'Identifier') {
					node.key.name = node.key.name.toLowerCase();
				}

				// make member usages lower case
				if (node.type === 'ThisExpression' && parent && parent.type === 'MemberExpression' && parent.property.type === 'Identifier') {
					parent.property.name = parent.property.name.toLowerCase();
				}
			},
		}) as Program;
	}
}

function proxyReturnStatement(): ReturnStatement {
	// compute: return new Proxy(this, { get: (t, p, r) => Reflect.get(t, p.toLowerCase(), r) });
	return returnStatement(
		newExpression(
			identifier('Proxy'),
			[
				thisExpression(),
				objectExpression([
					property('init', identifier('get'), arrowFunctionExpression(
						true,
						callExpression(
							memberExpression(identifier('Reflect'), identifier('get')),
							[
								identifier('t'),
								callExpression(
									memberExpression(identifier('p'), identifier('toLowerCase')),
									[],
								),
								identifier('r'),
							],
						),
						[
							identifier('t'),
							identifier('p'),
							identifier('r'),
						],
					)),
				]),
			],
		),
	);
}
