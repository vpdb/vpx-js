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

import { BlockStatement, Expression, Identifier } from 'estree';
import {
	assignmentExpression,
	binaryExpression,
	blockStatement,
	breakStatement,
	conditionalExpression,
	doWhileStatement,
	forOfStatement,
	forStatement,
	identifier,
	ifStatement,
	literal,
	whileStatement,
} from '../estree';
import { ESIToken } from '../grammar/grammar';

export function ppLoop(node: ESIToken): any {
	switch (node.type) {
		case 'WhileStatement':
			return ppWhileStatement(node);
		case 'DoTopLoopStatement':
			return ppDoTopLoopStatement(node);
		case 'DoBottomLoopStatement':
			return ppDoBottomLoopStatement(node);
		case 'ForStatement':
		case 'ForStatementInline':
			return ppForStatement(node);
		case 'ForEachStatement':
		case 'ForEachStatementInline':
			return ppForEachStatement(node);
	}
	return null;
}

function ppWhileStatement(node: ESIToken): any {
	const expr = node.children[0].estree;
	const block = node.children[2].type === 'Block' ? node.children[2].estree : null;
	return whileStatement(expr, block ? block : blockStatement([]));
}

function ppDoTopLoopStatement(node: ESIToken): any {
	let block: BlockStatement | undefined;
	for (const child of node.children) {
		if (child.type === 'Block') {
			block = child.estree;
		}
	}
	if (!block) {
		block = blockStatement([]);
	}
	if (node.children[0].type === 'WhileOrUntil') {
		if (node.children[0].text === 'While') {
			const expr = node.children[1].estree;
			return whileStatement(expr, block);
		} else {
			const expr = node.children[1].estree;
			block.body.unshift(ifStatement(expr, breakStatement(), null));
			return doWhileStatement(block, literal(true));
		}
	} else {
		return doWhileStatement(block, literal(true));
	}
}

function ppDoBottomLoopStatement(node: ESIToken): any {
	let block = node.children[1].type === 'Block' ? node.children[1].estree : null;
	let whileOrUntil;
	let expr;
	if (block !== null) {
		whileOrUntil = node.children[2].text;
		expr = node.children[3].estree;
	} else {
		whileOrUntil = node.children[1].text;
		expr = node.children[2].estree;
	}
	if (whileOrUntil === 'While') {
		return doWhileStatement(block ? block : blockStatement([]), expr);
	} else {
		if (block === null) {
			block = blockStatement([]);
		}
		block.body.push(ifStatement(expr, breakStatement(), null));
		return doWhileStatement(block, literal(true));
	}
}

function ppForStatement(node: ESIToken): any {
	const id = node.children[0].estree;
	const expr = node.children[2].estree;
	const expr2 = node.children[3].estree;
	let step = null;
	if (node.children[4].type === 'ForStep') {
		step = node.children[5].estree;
	}
	let block: BlockStatement | undefined;
	for (const child of node.children) {
		switch (child.type) {
			case 'Block':
				block = child.estree;
				break;
			case 'StatementsInline':
				block = blockStatement(child.estree);
				break;
		}
	}
	return forStatement(
		assignmentExpression(id, '=', expr),
		step
			? conditionalExpression(
					binaryExpression('<', step, literal(0)),
					binaryExpression('>=', id, expr2),
					binaryExpression('<=', id, expr2),
			)
			: binaryExpression('<=', id, expr2),
		assignmentExpression(id, '+=', step ? step : literal(1)),
		block ? block : blockStatement([]),
	);
}

function ppForEachStatement(node: ESIToken): any {
	let id: Identifier = identifier('undefined');
	let expr: Expression = identifier('undefined');
	let block: BlockStatement | undefined;
	for (const child of node.children) {
		switch (child.type) {
			case 'LoopControlVariable':
				id = child.estree;
				break;
			case 'Expression':
				expr = child.estree;
				break;
			case 'Block':
				block = child.estree;
				break;
			case 'StatementsInline':
				block = blockStatement(child.estree);
				break;
		}
	}
	return forOfStatement(id, expr, block ? block : blockStatement([]));
}
