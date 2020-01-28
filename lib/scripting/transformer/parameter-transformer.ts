import { replace } from 'estraverse';
import { Identifier, MemberExpression, Program, VariableDeclaration } from 'estree';
import { identifier, literal, memberExpression, variableDeclaration, variableDeclarator } from '../estree';
import { Transformer } from './transformer';

export class ParameterTransformer extends Transformer {
	constructor(ast: Program) {
		super(ast);
	}

	public transform(): Program {
		const paramsId = identifier( '__params' );
		return replace(this.ast, {
			enter: node => {
				if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') && node.params.length > 0) {
					const byRefs: { [index: string]: MemberExpression } = {};
					const byVals: VariableDeclaration[] = [];
					let index = 0;
					for (const param of node.params) {
						const id = param as Identifier;
						/* Create variable declarations for ByVal parameters */
						if ((param as any).byVal) {
							byVals.push(
								variableDeclaration('let', [
									variableDeclarator(
										id,
										memberExpression(paramsId, literal(index), true),
									),
								]),
							);
						} else {
							/* Create a map of ByRefs, ie byRefs['x'] = __params[0] */
							byRefs[id.name] = memberExpression(
								paramsId,
								literal(index),
								true,
							);
						}
						index++;
					}
					/* Replace all variables with by */
					replace(node.body, {
						leave: (bodyNode, parentNode) => {
							if (bodyNode.type === 'Identifier') {
								if (parentNode !== null && parentNode.type !== 'MethodDefinition') {
									if (byRefs[bodyNode.name] !== undefined) {
										if (parentNode.type === 'MemberExpression') {
											if (parentNode.object.type === 'Identifier') {
												if (parentNode.object.name === bodyNode.name) {
													return byRefs[bodyNode.name];
												}
											}
										} else {
											return byRefs[bodyNode.name];
										}
									}
								}
							}
						},
					});
					node.params = [ paramsId ];
					const block = node.body;
					/* FunctionDeclaration will have initial let declaration used for return */
					if ((node as any).funcDecl) {
						block.body.splice(1, 0, ...byVals);
					} else {
						block.body.unshift(...byVals);
					}
					return node;
				}
			},
		}) as Program;
	}
}
