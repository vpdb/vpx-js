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

import { blockStatement, breakStatement, ifStatement, switchCase, switchStatement } from '../estree';
import { ESIToken } from '../grammar/grammar';

export function ppConditional(node: ESIToken): any {
	let estree = null;
	if (node.type === 'BlockIfStatement') {
		estree = ppBlockIfStatement(node);
	} else if (node.type === 'ElseIfStatement') {
		estree = ppElseIfStatement(node);
	} else if (node.type === 'ElseStatement') {
		estree = ppElseStatement(node);
	} else if (node.type === 'LineIfThenStatement') {
		estree = ppLineIfThenStatement(node);
	} else if (node.type === 'SelectStatement') {
		estree = ppSelectStatement(node);
	} else if (node.type === 'CaseStatement') {
		estree = ppCaseStatement(node);
	} else if (node.type === 'CaseClauses') {
		estree = ppCaseClauses(node);
	} else if (node.type === 'CaseElseStatement') {
		estree = ppCaseElseStatement(node);
	}
	return estree;
}

function ppBlockIfStatement(node: ESIToken): any {
	const expr = node.children[0].estree;
	let block = null;
	let alternate = null;
	for (const child of node.children) {
		if (child.type === 'Block') {
			block = child.estree;
		} else if (child.type === 'ElseIfStatement' || child.type === 'ElseStatement') {
			if (alternate === null) {
				alternate = child.estree;
			} else {
				let tmpAlternate = alternate;
				while (tmpAlternate.alternate !== null) {
					tmpAlternate = tmpAlternate.alternate;
				}
				tmpAlternate.alternate = child.estree;
			}
		}
	}
	return ifStatement(expr, block ? block : blockStatement([]), alternate);
}

function ppElseIfStatement(node: ESIToken): any {
	const expr = node.children[1].estree;
	let block = null;
	for (const child of node.children) {
		if (child.type === 'Block') {
			block = child.estree;
		}
	}
	return ifStatement(expr, block ? block : blockStatement([]), null);
}

function ppElseStatement(node: ESIToken): any {
	let block = null;
	for (const child of node.children) {
		if (child.type === 'Block') {
			block = child.estree;
		}
	}
	return block ? block : blockStatement([]);
}

function ppLineIfThenStatement(node: ESIToken): any {
	const expr = node.children[0].estree;
	const stmts = node.children[1].estree;
	const elseStmts = node.children.length > 2 ? node.children[2].estree : null;
	return ifStatement(expr, blockStatement(stmts), elseStmts ? blockStatement(elseStmts) : null);
}

function ppSelectStatement(node: ESIToken): any {
	const expr = node.children[0].estree;
	let cases: any = [];
	for (const child of node.children) {
		if (child.type === 'CaseStatement') {
			cases = cases.concat([...child.estree]);
		} else if (child.type === 'CaseElseStatement') {
			cases.push(child.estree);
		}
	}
	return switchStatement(expr, cases);
}

function ppCaseStatement(node: ESIToken): any {
	const estree = [];
	const exprs = node.children[0].estree;
	let block = null;
	for (const child of node.children) {
		if (child.type === 'Block') {
			block = child.estree;
			break;
		}
	}
	for (let index = 0; index < exprs.length; index++) {
		if (index < exprs.length - 1) {
			estree.push(switchCase(exprs[index], []));
		} else {
			if (block === null) {
				block = blockStatement([]);
			}
			block.body.push(breakStatement());
			estree.push(switchCase(exprs[index], block.body));
		}
	}
	return estree;
}

function ppCaseClauses(node: ESIToken): any {
	const estree = [];
	for (const child of node.children) {
		if (child.type === 'CaseClause') {
			estree.push(child.estree);
		}
	}
	return estree;
}

function ppCaseElseStatement(node: ESIToken): any {
	let block = null;
	for (const child of node.children) {
		if (child.type === 'Block') {
			block = child.estree;
			break;
		}
	}
	return switchCase(null, block ? block.body : []);
}
