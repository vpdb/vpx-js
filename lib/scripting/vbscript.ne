@preprocessor typescript

@{%
const estree = require('./estree');

const ppDim = require('./post-process-dim');
const ppConst = require('./post-process-const');
const ppAssign = require('./post-process-assign');
const ppSubCall = require('./post-process-subcall');
const ppRem = require('./post-process-rem');
const ppExpr = require('./post-process-expr');
const ppLiteral = require('./post-process-literal');
const ppOption = require('./post-process-option');
const ppSub = require('./post-process-sub');
const ppFunction = require('./post-process-function');
const ppIf = require('./post-process-if');
const ppWith = require('./post-process-with');
const ppFor = require('./post-process-for');
const ppLoop = require('./post-process-loop');
const ppSelect = require('./post-process-select');

const ppHelpers = require('./post-process-helpers');

const moo = require('moo');

const caseInsensitiveKeywords = (defs: object) => {
    var keywords = moo.keywords(defs);
    return (value: string) => keywords(value.toLowerCase());
};

const lexer = moo.compile({
    comment_rem: /[Rr][Ee][Mm][ ]+[\x01-\x09|\x0b-\x0c|\x0e-\x39|\x3b-\xD7FF|\xE000-\xFFEF]*|[Rr][Ee][Mm]/,
    comment_apostophe: /'[\x01-\x09|\x0b-\x0c|\x0e-\x39|\x3b-\xD7FF|\xE000-\xFFEF]*/,
    identifier_dot: /[a-zA-Z][a-zA-Z0-9_]*\.[ ]*/,
    identifier: {
        match: /[a-zA-Z][a-zA-Z0-9_]*/,
        type: caseInsensitiveKeywords({
            'kw_byval': 'byval',
            'kw_byref': 'byref',
            'kw_set': 'set',
            'kw_dim': 'dim',
            'kw_const': 'const',
            'kw_select': 'select',
            'kw_true': 'true',
            'kw_false': 'false',
            'kw_option': 'option',
            'kw_explicit': 'explicit',
            'kw_eqv': 'eqv',
            'kw_xor': 'xor',
            'kw_or': 'or',
            'kw_and': 'and',
            'kw_not': 'not',
            'kw_mod': 'mod',
            'kw_is': 'is',
            'kw_if': 'if',
            'kw_then': 'then',
            'kw_elseif': 'elseif',
            'kw_else': 'else',
            'kw_for': 'for',
            'kw_to': 'to',
            'kw_step': 'step',
            'kw_each': 'each',
            'kw_in': 'in',    
            'kw_next': 'next',
            'kw_sub': 'sub',
            'kw_end': 'end',
            'kw_function': 'function',
            'kw_public': 'public',
            'kw_default': 'default',
            'kw_private': 'private',
            'kw_nothing': 'nothing',
            'kw_null': 'null',
            'kw_empty': 'empty',
            'kw_while': 'while',
            'kw_wend': 'wend',
            'kw_until': 'until',
            'kw_loop': 'loop',
            'kw_do': 'do',
            'kw_with': 'with',
            'kw_case': 'case',
        }),
    },
    dot_identifier: /\.[a-zA-Z][a-zA-Z0-9_]*/,
    float_literal: /[0-9]+\.[0-9]*|\.[0-9]+/,
    int_literal: /[0-9]+/,
    hex_literal: /&[Hh][0-9A-Fa-f]+&/,
    oct_literal: /&[0-7]+&/,
    date_literal: /#[\x20-\x22|\x24-\x7e|\xA0]+#/,
    comma: /,/,
    ampersand: /&/,
    apostophe: /'/,
    compare_equals: /==/,
    compare_gte: />=|=>/,
    compare_lte: /<=|=</,
    compare_gtlt: /<>/,
    compare_gt: />/,
    compare_lt: /</,
    paren_left: /\(/,
    paren_right: /\)/,
    equals: /=/,
    exponent: /\^/,
    unary: /[+-]/,
    mul_div: /[*\/]/,
    int_div: /\\/,
    string_literal: /\"(?:[\x01-\x21|\x23-\xD7FF|\xE000-\xFFEF]|\"\")*\"/,
    ws: /[ \t\v\f]/,
    nl: {match: /\x0d\x0a|[\x0d\x0a:]/, lineBreaks: true},
});

%}

@lexer lexer

#===============================
# Rules
#===============================

Program              -> NL:? GlobalStmt:*                                                                                                 {% ppHelpers.program %}
                      | _ GlobalStmt:*                                                                                                    {% ppHelpers.program %}

#===============================
# Rules : Declarations
#===============================

DimDecl              -> %kw_dim __  DimVarList NL                                                                                         {% ppDim.stmt %}

DimVarList           -> DimVarName DimOtherVars:*                                                                                         {% ppDim.dimVarList %}

DimVarName           -> ExtendedID                                                                                                        {% id %}

DimOtherVars         -> %comma _ DimVarName                                                                                               {% data => data[2] %}

ConstDecl            -> AccessModifierOpt __ %kw_const __ ConstVarList NL                                                                 {% ppConst.stmt1 %}
                      | %kw_const __ ConstVarList NL                                                                                      {% ppConst.stmt2 %}

ConstVarList         -> ConstVarNameValue ConstOtherVars:*                                                                                {% ppConst.constVarList %}

ConstOtherVars       -> %comma _ ConstVarNameValue                                                                                        {% data => data[2] %}

ConstVarNameValue    -> ExtendedID _ %equals _ ConstExprDef

ConstExprDef         -> %paren_left _ ConstExprDef _ %paren_right                                                                         {% data => data[2] %}
                      | %unary _ ConstExprDef                                                                                             {% ppExpr.unary %}
                      | ConstExpr                                                                                                         {% id %}
                     
SubDecl              -> MethodAccessOpt:? %kw_sub __ ExtendedID _ MethodArgList:? NL MethodStmtList %kw_end __ %kw_sub NL                 {% ppSub.stmt %}
                 
FunctionDecl         -> MethodAccessOpt:? %kw_function __ ExtendedID _ MethodArgList:? NL MethodStmtList %kw_end __ %kw_function NL       {% ppFunction.stmt %}

MethodAccessOpt      -> %kw_public __ %kw_default __                                                                                      {% data => [ data[0], data[2] ] %}
                      | AccessModifierOpt                                                                                                 {% data => [ data[0] ] %}

AccessModifierOpt    -> %kw_public __                                                                                                     {% id %}
                      | %kw_private __                                                                                                    {% id %}

MethodArgList        -> %paren_left _ Arg _ OtherArgsOpt:* _ %paren_right                                                                 {% ppHelpers.methodArgList1 %}
                      | %paren_left _ %paren_right                                                                                        {% ppHelpers.methodArgList2 %}

OtherArgsOpt         -> %comma _ Arg                                                                                                      {% data => data[2] %}

Arg                  -> ArgModifierOpt:? ExtendedID _ %paren_left _ %paren_right                                                          {% data => data[1] %}
                      | ArgModifierOpt:? ExtendedID                                                                                       {% data => data[1] %}

ArgModifierOpt       -> %kw_byval __                                                                                                      {% id %}
                      | %kw_byref __                                                                                                      {% id %}

#===============================
# Rules : Statements
#===============================

BlockStmtList        -> BlockStmt:*                                                                                                       {% ppHelpers.blockStmtList %}
MethodStmtList       -> MethodStmt:*                                                                                                      {% ppHelpers.methodStmtList %}

GlobalStmt           -> OptionExplicit                                                                                                    {% id %}
                      | ConstDecl                                                                                                         {% id %}
                      | SubDecl                                                                                                           {% id %}
                      | FunctionDecl                                                                                                      {% id %}
                      | BlockStmt                                                                                                         {% id %}

MethodStmt           -> ConstDecl                                                                                                         {% id %}
                      | BlockStmt                                                                                                         {% id %}

BlockStmt            -> RemStmt                                                                                                           {% id %}
                      | DimDecl                                                                                                           {% id %}
                      | IfStmt                                                                                                            {% id %}
                      | WithStmt                                                                                                          {% id %}
                      | SelectStmt                                                                                                        {% id %}
                      | LoopStmt                                                                                                          {% id %}
                      | ForStmt                                                                                                           {% id %}
                      | InlineStmt NL                                                                                                     {% ppHelpers.blockStmt1 %}
                      | NL                                                                                                                {% ppHelpers.blockStmt2 %}

InlineStmt           -> AssignStmt                                                                                                        {% id %}
                      | SubCallStmt                                                                                                       {% id %}

RemStmt              -> %comment_rem NL                                                                                                   {% ppRem.stmt %}

OptionExplicit       -> %kw_option __ %kw_explicit NL                                                                                     {% ppOption.explicit %}

AssignStmt           -> LeftExpr _ %equals _ Expr                                                                                         {% ppAssign.stmt1 %}
                      | %kw_set __ LeftExpr _ %equals _ Expr                                                                              {% ppAssign.stmt2 %}
 
SubCallStmt          -> QualifiedID _ SubSafeExpr:? _ CommaExprList:*                                                                     {% ppSubCall.stmt1 %}
                      | QualifiedID _ %paren_left _ Expr _ %paren_right _ CommaExprList:*                                                 {% ppSubCall.stmt2 %}
                      | QualifiedID _ %paren_left _ Expr _ %paren_right                                                                   {% ppSubCall.stmt3 %}
                      | QualifiedID _ %paren_left _ %paren_right                                                                          {% ppSubCall.stmt4 %}

LeftExpr             -> QualifiedID _ IndexOrParams:+                                                                                     {% ppHelpers.leftExpr1 %}
                      | QualifiedID                                                                                                       {% id %}

IndexOrParams        -> %paren_left _ Expr _ CommaExprList:+ _ %paren_right                                                               {% ppHelpers.indexOrParams1 %}
                      | %paren_left _ CommaExprList:+ _ %paren_right                                                                      {% ppHelpers.indexOrParams2 %}
                      | %paren_left _ Expr _ %paren_right                                                                                 {% ppHelpers.indexOrParams3 %}
                      | %paren_left _ %paren_right                                                                                        {% ppHelpers.indexOrParams4 %}

QualifiedID          -> IDDot QualifiedID                                                                                                 {% ppHelpers.qualifiedId %}
                      | ID                                                                                                                {% id %}
                      | DotID                                                                                                             {% id %}

ExtendedID           -> ID                                                                                                                {% id %}

CommaExprList        -> %comma _ Expr                                                                                                     {% ppHelpers.commaExprList1 %}
                      | %comma _                                                                                                          {% ppHelpers.commaExprList2 %}

#========= If Statement

IfStmt               -> %kw_if _ Expr _ %kw_then NL BlockStmtList ElseIfStmt:* ElseStmt:? %kw_end __ %kw_if NL                            {% ppIf.stmt1 %}
                      | %kw_if _ Expr _ %kw_then __ InlineStmt __ %kw_else __ InlineStmt __ %kw_end __ %kw_if NL                          {% ppIf.stmt2 %}
                      | %kw_if _ Expr _ %kw_then __ InlineStmt __ %kw_else __ InlineStmt NL                                               {% ppIf.stmt3 %}
                      | %kw_if _ Expr _ %kw_then __ InlineStmt __ %kw_end __ %kw_if NL                                                    {% ppIf.stmt4 %}
                      | %kw_if _ Expr _ %kw_then __ InlineStmt NL                                                                         {% ppIf.stmt5 %}

ElseIfStmt           -> %kw_elseif _ Expr _ %kw_then NL BlockStmtList                                                                     {% ppIf.elseIfStmt1 %}
                      | %kw_elseif _ Expr _ %kw_then __ InlineStmt NL                                                                     {% ppIf.elseIfStmt2 %}

ElseStmt             -> %kw_else __ InlineStmt NL                                                                                         {% ppIf.elseStmt1 %}
                      | %kw_else NL BlockStmtList                                                                                         {% ppIf.elseStmt2 %}

#========= With Statement

WithStmt             -> %kw_with _ Expr NL BlockStmtList %kw_end __ %kw_with NL                                                           {% ppWith.stmt %}

#========= Loop Statement
 
LoopStmt             -> %kw_do __ LoopType _ Expr NL BlockStmtList %kw_loop NL                                                            {% ppLoop.stmt1 %}
                      | %kw_do NL BlockStmtList %kw_loop __ LoopType _ Expr NL                                                            {% ppLoop.stmt2 %}
                      | %kw_do NL BlockStmtList %kw_loop NL                                                                               {% ppLoop.stmt3 %}
                      | %kw_while _ Expr NL BlockStmtList %kw_wend NL                                                                     {% ppLoop.stmt4 %}

LoopType             -> %kw_while                                                                                                         {% id %}
                      | %kw_until                                                                                                         {% id %}

#========= For Statement

ForStmt              -> %kw_for _ ExtendedID _ %equals _ Expr _ %kw_to _ Expr _ %kw_step _ Expr NL BlockStmtList %kw_next NL              {% ppFor.stmt1 %}
                      | %kw_for _ ExtendedID _ %equals _ Expr _ %kw_to _ Expr NL BlockStmtList %kw_next NL                                {% ppFor.stmt2 %}
                      | %kw_for __ %kw_each _ ExtendedID _ %kw_in _ Expr NL BlockStmtList %kw_next NL                                     {% ppFor.stmt3 %}

#========= Select Statement

SelectStmt           -> %kw_select __ %kw_case _ Expr NL CaseStmt:* CaseElseStmt:? %kw_end __ %kw_select NL                               {% ppSelect.stmt %}

CaseStmt             -> %kw_case _ Expr _ OtherExprOpt:* BlockStmtList                                                                    {% ppSelect.caseStmt %}
                                                                                                                    
CaseElseStmt         -> %kw_case __ %kw_else BlockStmtList                                                                                {% ppSelect.caseElseStmt %}
 
OtherExprOpt         -> %comma _ Expr                                                                                                     {% data => data[2] %}

#===============================
# Rules : Expressions
#===============================

SubSafeExpr          -> SubSafeConcatExpr                                                                                                 {% id %}

SubSafeConcatExpr    -> SubSafeConcatExpr _ %ampersand _ AddExpr                                                                          {% ppExpr.concat %}
                      | SubSafeValue                                                                                                      {% id %}

SubSafeValue         -> ConstExpr                                                                                                         {% id %}
                      | LeftExpr                                                                                                          {% id %}

Expr                 -> EqvExpr                                                                                                           {% id %}

EqvExpr              -> EqvExpr _ %kw_eqv _ XorExpr                                                                                       {% ppExpr.eqv %}
                      | XorExpr                                                                                                           {% id %}

XorExpr              -> XorExpr _ %kw_xor _ OrExpr                                                                                        {% ppExpr.xor %}
                      | OrExpr                                                                                                            {% id %}

OrExpr               -> OrExpr _ %kw_or _ AndExpr                                                                                         {% ppExpr.or %}
                      | AndExpr                                                                                                           {% id %}

AndExpr              -> AndExpr _ %kw_and _ NotExpr                                                                                       {% ppExpr.and %}
                      | NotExpr                                                                                                           {% id %}

NotExpr              -> %kw_not _ NotExpr                                                                                                 {% ppExpr.not %}
                      | CompareExpr                                                                                                       {% id %}

CompareExpr          -> CompareExpr _ %kw_is _ AddExpr                                                                                    {% ppExpr.is %}
                      | CompareExpr _ %kw_is __ %kw_not _ AddExpr                                                                         {% ppExpr.isNot %}
                      | CompareExpr _ %compare_gte _ AddExpr                                                                              {% ppExpr.gte %}
                      | CompareExpr _ %compare_lte _ AddExpr                                                                              {% ppExpr.lte %}
                      | CompareExpr _ %compare_gt _ AddExpr                                                                               {% ppExpr.gt %}
                      | CompareExpr _ %compare_lt _ AddExpr                                                                               {% ppExpr.lt %}
                      | CompareExpr _ %compare_gtlt _ AddExpr                                                                             {% ppExpr.gtlt %}
                      | CompareExpr _ %equals _ AddExpr                                                                                   {% ppExpr.eq %}
                      | ConcatExpr                                                                                                        {% id %}

ConcatExpr           -> ConcatExpr _ %ampersand _ AddExpr                                                                                 {% ppExpr.concat %}
                      | AddExpr                                                                                                           {% id %}

AddExpr              -> AddExpr _ %unary _ ModExpr                                                                                        {% ppExpr.add %}
                      | ModExpr                                                                                                           {% id %}

ModExpr              -> ModExpr _ %kw_mod _ IntDivExpr                                                                                    {% ppExpr.mod %}
                      | IntDivExpr                                                                                                        {% id %}

IntDivExpr           -> IntDivExpr _ %int_div _ MultExpr                                                                                  {% ppExpr.intDiv %}
                      | MultExpr                                                                                                          {% id %}

MultExpr             -> MultExpr _ %mul_div _ UnaryExpr                                                                                   {% ppExpr.mult %}
                      | UnaryExpr                                                                                                         {% id %}

UnaryExpr            -> %unary _ UnaryExpr                                                                                                {% ppExpr.unary %}
                      | ExpExpr                                                                                                           {% id %}

ExpExpr              -> Value _ %exponent _ ExpExpr                                                                                       {% ppExpr.exp %}
                      | Value                                                                                                             {% id %}

Value                -> ConstExpr                                                                                                         {% id %}
                      | LeftExpr                                                                                                          {% id %}
                      | %paren_left _ Expr _ %paren_right                                                                                 {% data => data[2] %}

ConstExpr            -> BoolLiteral                                                                                                       {% id %}
                      | IntLiteral                                                                                                        {% id %}
                      | FloatLiteral                                                                                                      {% id %}
                      | StringLiteral                                                                                                     {% id %}
                      | DateLiteral                                                                                                       {% id %}
                      | Nothing                                                                                                           {% id %}

BoolLiteral          -> %kw_true                                                                                                          {% ppLiteral.bool %}
                      | %kw_false                                                                                                         {% ppLiteral.bool %}

IntLiteral           -> %int_literal                                                                                                      {% ppLiteral.int %}
                      | %hex_literal                                                                                                      {% ppLiteral.hex %}
                      | %oct_literal                                                                                                      {% ppLiteral.oct %}

FloatLiteral         -> %float_literal                                                                                                    {% ppLiteral.float %}

StringLiteral        -> %string_literal                                                                                                   {% ppLiteral.string %}

DateLiteral          -> %date_literal                                                                                                     {% ppLiteral.date %}

Nothing              -> %kw_nothing                                                                                                       {% ppLiteral.nothing %}
                      | %kw_null                                                                                                          {% ppLiteral.nothing %}
                      | %kw_empty                                                                                                         {% ppLiteral.nothing %}

#===============================
# Terminals
#===============================

NL                   -> _ %comment_apostophe:? %nl _                                                                                      {% ppHelpers.nl %}

ID                   -> %identifier                                                                                                       {% ppHelpers.id %}
IDDot                -> %identifier_dot                                                                                                   {% ppHelpers.id %}
DotID                -> %dot_identifier                                                                                                   {% ppHelpers.id %}

_                    -> %ws:*                                                                                                             {% data => null %}
__                   -> %ws:+                                                                                                             {% data => null %}