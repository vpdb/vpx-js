import { replace, traverse, VisitorOption } from 'estraverse';
import {
	CallExpression,
	Expression,
	Identifier,
	MemberExpression,
	Pattern,
	Program,
	VariableDeclaration
} from 'estree';
import {
	arrayExpression, arrayPattern, assignmentExpression, expressionStatement,
	identifier,
	literal,
	memberExpression,
	variableDeclaration,
	variableDeclarator
} from '../estree';
import { Transformer } from './transformer';

export class ParameterTransformer extends Transformer {

	constructor(ast: Program) {
		super(ast);
	}

	public transform(): Program {
		this.transformCallee();
		this.transformCaller();

		return this.ast;
	}

	public transformCaller(): void {
		traverse(this.ast, {
			enter: (node, parent) => {
				if (node.type === 'Program' || node.type === 'BlockStatement') {
					let indent = 0;
					const callExpressionNodes: CallExpression[] = [];
					let callExpressionParent: any = null;
					replace(node, {
						enter: (innerNode, innerParent) => {
							//console.log('%senter %s', new Array(indent++ * 3).join(' '), innerNode.type);
							if (innerNode.type === 'CallExpression' && !callExpressionNodes.includes(innerNode)) {
								callExpressionNodes.push(innerNode);
								callExpressionParent = callExpressionParent || innerParent;
							}
						},
						leave: innerNode => {
							if (innerNode.type === 'CallExpression') {
								const paramName = '__args' + (callExpressionNodes.length - 1);
								const before = variableDeclaration('const', [
									variableDeclarator(identifier(paramName), arrayExpression(innerNode.arguments as Expression[])),
								]);
								const after = expressionStatement(
									assignmentExpression(
										arrayPattern(innerNode.arguments.map(n => n.type === 'Identifier' ? n : null) as Pattern[]),
										'=',
										identifier(paramName),
									),
								);
								innerNode.arguments = [ identifier(paramName) ];
								node.body.splice(node.body.indexOf(callExpressionParent as any), 0, before);
								node.body.splice(node.body.indexOf(callExpressionParent as any) + 1, 0, after);

								callExpressionNodes.splice(callExpressionNodes.indexOf(innerNode), 1);
								if (callExpressionNodes.length === 0) {
									callExpressionParent = null;
								}
							}
							//console.log('%sleave %s', new Array(--indent * 3).join(' '), innerNode.type);
						},
					});
					// TODO handle nested blocks
					return VisitorOption.Break;
				}
			},
		});
	}

	public transformCallee(): void {
		const paramsId = identifier( '__params' );
		replace(this.ast, {
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
		});
	}
}
