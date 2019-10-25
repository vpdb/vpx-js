@preprocessor typescript

@{%
const estree = require('./estree');

const ppField = require('./post-process/field');
const ppDim = require('./post-process/dim');
const ppConst = require('./post-process/const');
const ppSub = require('./post-process/sub');
const ppFunction = require('./post-process/function');
const ppOption = require('./post-process/option');
const ppRem = require('./post-process/rem');
const ppIf = require('./post-process/if');
const ppWith = require('./post-process/with');
const ppSelect = require('./post-process/select');
const ppLoop = require('./post-process/loop');
const ppFor = require('./post-process/for');
const ppRedim = require('./post-process/redim');
const ppAssign = require('./post-process/assign');
const ppSubCall = require('./post-process/subcall');
const ppError = require('./post-process/error');
const ppExpr = require('./post-process/expr');
const ppLiterals = require('./post-process/literals');
const ppHelpers = require('./post-process/helpers');

const moo = require('moo');

const caseInsensitiveKeywords = (defs: object) => {
    var keywords = moo.keywords(defs);
    return (value: string) => keywords(value.toLowerCase());
};

const lexer = moo.compile({
        comment_apostophe: /[ \t\v\f]*'[\x01-\x09|\x0b-\x0c|\x0e-\x39|\x3b-\xD7FF|\xE000-\xFFEF]*[\x0d\x0a][ \t\v\f\x0d\x0a]*/,
        comment_rem: /[Rr][Ee][Mm][^A-zA-z0-9][\x01-\x09|\x0b-\x0c|\x0e-\x39|\x3b-\xD7FF|\xE000-\xFFEF]*[\x0d\x0a][ \t\v\f\x0d\x0a]*|[Rr][Ee][Mm][\x0d\x0a][ \t\v\f\x0d\x0a]*/,
        identifier_dot: /[a-zA-Z][a-zA-Z0-9_]*\.[ \t\v\f]*/,
        identifier: {
            match: /[a-zA-Z][a-zA-Z0-9_]*/,
            type: caseInsensitiveKeywords({
                'kw_and': 'and',
                'kw_byval': 'byval',
                'kw_byref': 'byref',
                'kw_case': 'case',
                'kw_call': 'call',
                'kw_class': 'class',
                'kw_const': 'const',
                'kw_default': 'default',
                'kw_dim': 'dim',
                'kw_do': 'do',
                'kw_each': 'each',
                'kw_else': 'else',
                'kw_elseif': 'elseif',
                'kw_empty': 'empty',
                'kw_end': 'end',
                'kw_erase': 'erase',
                'kw_error': 'error',
                'kw_eqv': 'eqv',
                'kw_exit': 'exit',
                'kw_explicit': 'explicit',
                'kw_false': 'false',
                'kw_for': 'for',
                'kw_function': 'function',
                'kw_get': 'get',
                'kw_goto': 'goto',
                'kw_if': 'if',
                'kw_in': 'in',
                'kw_is': 'is',
                'kw_let': 'let',
                'kw_loop': 'loop',
                'kw_mod': 'mod',
                'kw_new': 'new',
                'kw_next': 'next',
                'kw_not': 'not',
                'kw_nothing': 'nothing',
                'kw_null': 'null',
                'kw_on': 'on',
                'kw_option': 'option',
                'kw_or': 'or',
                'kw_preserve': 'preserve',
                'kw_private': 'private',
                'kw_property': 'property',
                'kw_public': 'public',
                'kw_redim': 'redim',
                'kw_resume': 'resume',
                'kw_select': 'select',
                'kw_set': 'set',
                'kw_step': 'step',
                'kw_sub': 'sub',
                'kw_then': 'then',
                'kw_to': 'to',
                'kw_true': 'true',
                'kw_until': 'until',
                'kw_while': 'while',
                'kw_wend': 'wend',
                'kw_with': 'with',
                'kw_xor': 'xor',
            }),
        },
        float_literal: /[0-9]+\.[0-9]*|\.[0-9]+/,
        int_literal: /[0-9]+/,
        hex_literal: /&[Hh][0-9A-Fa-f]+&|&[Hh][0-9A-Fa-f]+/,
        oct_literal: /&[0-7]+&|&[0-7]+/,
        date_literal: /#[\x20-\x22|\x24-\x7e|\xA0]+#/,
        dot_identifier_dot: /\.[a-zA-Z][a-zA-Z0-9_]*\./,
        dot_identifier: /\.[a-zA-Z][a-zA-Z0-9_]*/,
        comma: /,/,
        ampersand: /&/,
        compare_equals: /==/,
        compare_gte: />=|=>/,
        compare_lte: /<=|=</,
        compare_gtlt: /<>/,
        compare_gt: />/,
        compare_lt: /</,
        paren_left: /\(/,
        paren_right_dot: /\)\./,
        paren_right: /\)/,
        dot: /\./,
        equals: /=/,
        exponent: /\^/,
        unary: /[+-]/,
        mul_div: /[*\/]/,
        int_div: /\\/,
        string_literal: /\"(?:[\x01-\x21|\x23-\xD7FF|\xE000-\xFFEF]|\"\")*\"/,
        new_line: {match: /[ \t\v\f]*[\x0d\x0a:][ \t\v\f\x0d\x0a]*/, lineBreaks: true},
        whitespace: /[ \t\v\f]+/,
        whitespace_cont: /_[ \t\v\f]*\x0d\x0a[ \t\v\f]*|_[ \t\v\f]*[\x0d\x0a][ \t\v\f]*|_[ \t\v\f]*/,
});

%}

@lexer lexer

#===============================
# Rules
#===============================

Program              -> GlobalStmtList                                                                                                    {% ppHelpers.program %}

#===============================
# Rules : Declarations
#===============================

FieldDecl            -> %kw_private __ FieldName _ OtherVarsOpt NL                                                                        {% ppField.fieldDecl1 %}
                      | %kw_public __ FieldName _ OtherVarsOpt NL                                                                         {% ppField.fieldDecl2 %}

FieldName            -> FieldID _ %paren_left _ ArrayRankList _ %paren_right                                                              {% ppField.fieldName %}
                      | FieldID                                                                                                           {% id %}

FieldID              -> ID                                                                                                                {% id %}
                      | %kw_default __                                                                                                    {% id %}
                      | %kw_erase __                                                                                                      {% id %}
                      | %kw_error __                                                                                                      {% id %}
                      | %kw_explicit __                                                                                                   {% id %}
                      | %kw_step __                                                                                                       {% id %}

VarDecl              -> %kw_dim __ VarName _ OtherVarsOpt NL                                                                              {% ppDim.varDecl %}

VarName              -> ExtendedID _ %paren_left _ ArrayRankList _ %paren_right                                                           {% ppDim.varName1 %}
                      | ExtendedID                                                                                                        {% ppDim.varName2 %}

OtherVarsOpt         -> %comma _ VarName _ OtherVarsOpt                                                                                   {% ppDim.otherVarsOpt %}
                      | null                                                                                                              {% data => null %}

ArrayRankList        -> IntLiteral _ %comma _ ArrayRankList                                                                               {% ppHelpers.arrayRankList1 %}
                      | IntLiteral                                                                                                        {% ppHelpers.arrayRankList2 %}
                      | null                                                                                                              {% data => null %}

ConstDecl            -> AccessModifierOpt %kw_const __ ConstList NL                                                                       {% ppConst.constDecl %}

ConstList            -> ExtendedID _ %equals _ ConstExprDef _ %comma _ ConstList                                                          {% ppConst.constList1 %}
                      | ExtendedID _ %equals _ ConstExprDef                                                                               {% ppConst.constList2 %}

ConstExprDef         -> %paren_left _ ConstExprDef _ %paren_right                                                                         {% ppConst.constExprDef1 %}
                      | %unary _ ConstExprDef                                                                                             {% ppConst.constExprDef2 %}
                      | ConstExpr                                                                                                         {% id %}

SubDecl              -> MethodAccessOpt %kw_sub _ ExtendedID _ MethodArgList NL MethodStmtList %kw_end __ %kw_sub NL                      {% ppSub.subDecl1 %}
                      | MethodAccessOpt %kw_sub _ ExtendedID _ MethodArgList _ InlineStmt _ %kw_end __ %kw_sub NL                         {% ppSub.subDecl2 %}

FunctionDecl         -> MethodAccessOpt %kw_function _ ExtendedID _ MethodArgList NL MethodStmtList %kw_end __ %kw_function NL            {% ppFunction.functionDecl1 %}
                      | MethodAccessOpt %kw_function _ ExtendedID _ MethodArgList _ InlineStmt _ %kw_end __ %kw_function NL               {% ppFunction.functionDecl2 %}

MethodAccessOpt      -> %kw_public __ %kw_default __                                                                                      {% data => [ data[0], data[2] ] %}
                      | AccessModifierOpt                                                                                                 {% data => [ data[0] ] %}

AccessModifierOpt    -> %kw_public __                                                                                                     {% id %}
                      | %kw_private __                                                                                                    {% id %}
                      | null                                                                                                              {% data => null %}

MethodArgList        -> %paren_left _ ArgList _ %paren_right                                                                              {% ppHelpers.methodArgList1 %}
                      | %paren_left _ %paren_right                                                                                        {% ppHelpers.methodArgList2 %}
                      | null                                                                                                              {% data => null %}

ArgList              -> Arg _ %comma _ ArgList                                                                                            {% ppHelpers.argList1 %}
                      | Arg                                                                                                               {% ppHelpers.argList2 %}

Arg                  -> ArgModifierOpt ExtendedID _ %paren_left _ %paren_right                                                            {% ppHelpers.arg1 %}
                      | ArgModifierOpt ExtendedID                                                                                         {% ppHelpers.arg2 %}

ArgModifierOpt       -> %kw_byval __
                      | %kw_byref __
                      | null                                                                                                              {% data => null %}

#===============================
# Rules : Statements
#===============================

GlobalStmt           -> OptionExplicit                                                                                                    {% id %}
                      | FieldDecl                                                                                                         {% id %}
                      | ConstDecl                                                                                                         {% id %}
                      | SubDecl                                                                                                           {% id %}
                      | FunctionDecl                                                                                                      {% id %}
                      | BlockStmt                                                                                                         {% id %}

MethodStmt           -> ConstDecl                                                                                                         {% id %}
                      | BlockStmt                                                                                                         {% id %}

BlockStmt            -> VarDecl                                                                                                           {% id %}
                      | RedimStmt                                                                                                         {% id %}
                      | IfStmt                                                                                                            {% id %}
                      | WithStmt                                                                                                          {% id %}
                      | SelectStmt                                                                                                        {% id %}
                      | LoopStmt                                                                                                          {% id %}
                      | ForStmt                                                                                                           {% id %}
                      | InlineStmt NL                                                                                                     {% ppHelpers.blockStmt %}
                      | RemStmt                                                                                                           {% id %}
                      | CommentLine                                                                                                       {% id %}

InlineStmt           -> AssignStmt                                                                                                        {% id %}
                      | SubCallStmt                                                                                                       {% id %}
                      | ErrorStmt                                                                                                         {% id %}
                      | ExitStmt                                                                                                          {% id %}

GlobalStmtList       -> GlobalStmt GlobalStmtList                                                                                         {% ppHelpers.globalStmtList %}
                      | null

MethodStmtList       -> MethodStmt MethodStmtList                                                                                         {% ppHelpers.methodStmtList %}
                      | null

BlockStmtList        -> BlockStmt BlockStmtList                                                                                           {% ppHelpers.blockStmtList %}
                      | null                                                                                                              {% data => null %}

RemStmt              -> %comment_rem                                                                                                      {% ppRem.stmt %}

OptionExplicit       -> %kw_option __ %kw_explicit NL                                                                                     {% ppOption.stmt %}

ErrorStmt            -> %kw_on __ %kw_error __ %kw_resume __ %kw_next                                                                     {% ppError.stmt1 %}
                      | %kw_on __ %kw_error __ %kw_goto __ IntLiteral                                                                     {% ppError.stmt2 %}

ExitStmt             -> %kw_exit __ %kw_do                                                                                                {% ppHelpers.exitStmt %}
                      | %kw_exit __ %kw_for                                                                                               {% ppHelpers.exitStmt %}
                      | %kw_exit __ %kw_function                                                                                          {% ppHelpers.exitStmt %}
                      | %kw_exit __ %kw_sub                                                                                               {% ppHelpers.exitStmt %}

AssignStmt           -> LeftExpr _ %equals _ Expr                                                                                         {% ppAssign.stmt1 %}
                      | %kw_set __ LeftExpr _ %equals _ Expr                                                                              {% ppAssign.stmt2 %}
                      | %kw_set __ LeftExpr _ %equals _ %kw_new _ Expr                                                                    {% ppAssign.stmt3 %}

SubCallStmt          -> QualifiedID _ SubSafeExprOpt _ CommaExprList                                                                      {% ppSubCall.stmt1 %}
                      | QualifiedID _ SubSafeExprOpt                                                                                      {% ppSubCall.stmt2 %}
                      | QualifiedID _ %paren_left _ Expr _ %paren_right _ CommaExprList                                                   {% ppSubCall.stmt3 %}
                      | QualifiedID _ %paren_left _ Expr _ %paren_right                                                                   {% ppSubCall.stmt4 %}
                      | QualifiedID _ %paren_left _ %paren_right                                                                          {% ppSubCall.stmt5 %}
#                     | QualifiedID _ IndexOrParamsList %dot LeftExprTail _ SubSafeExprOpt _ CommaExprList                                {% ppSubCall.stmt6 %}
#                     | QualifiedID _ IndexOrParamsListDot LeftExprTail _ SubSafeExprOpt _ CommaExprList                                  {% ppSubCall.stmt7 %}
#                     | QualifiedID _ IndexOrParamsList %dot LeftExprTail _ SubSafeExprOpt                                                {% ppSubCall.stmt8 %}
                      | QualifiedID _ IndexOrParamsListDot LeftExprTail _ SubSafeExprOpt                                                  {% ppSubCall.stmt9 %}

SubSafeExprOpt       -> SubSafeExpr                                                                                                       {% id %}
                      | null                                                                                                              {% data => null %}

LeftExpr             -> QualifiedID _ IndexOrParamsList %dot LeftExprTail                                                                 {% ppHelpers.leftExpr1 %}
                      | QualifiedID _ IndexOrParamsListDot LeftExprTail                                                                   {% ppHelpers.leftExpr2 %}
                      | QualifiedID _ IndexOrParamsList                                                                                   {% ppHelpers.leftExpr3 %}
                      | QualifiedID                                                                                                       {% id %}

LeftExprTail         -> QualifiedIDTail _ IndexOrParamsList %dot LeftExprTail                                                             {% ppHelpers.leftExprTail1 %}
                      | QualifiedIDTail _ IndexOrParamsListDot LeftExprTail                                                               {% ppHelpers.leftExprTail2 %}
                      | QualifiedIDTail _ IndexOrParamsList                                                                               {% ppHelpers.leftExprTail3 %}
                      | QualifiedIDTail                                                                                                   {% id %}

QualifiedID          -> IDDot QualifiedIDTail                                                                                             {% ppHelpers.qualifiedId1 %}
                      | DotIDDot QualifiedIDTail                                                                                          {% ppHelpers.qualifiedId2 %}
                      | ID                                                                                                                {% id %}
                      | DotID                                                                                                             {% id %}

QualifiedIDTail      -> IDDot QualifiedIDTail                                                                                             {% ppHelpers.qualifiedIdTail1 %}
                      | ID                                                                                                                {% id %}

ExtendedID           -> ID                                                                                                                {% id %}

IndexOrParamsList    -> IndexOrParams IndexOrParamsList                                                                                   {% ppHelpers.indexOrParamsList1 %}
                      | IndexOrParams                                                                                                     {% ppHelpers.indexOrParamsList2 %}

IndexOrParams        -> %paren_left _ Expr _ CommaExprList %paren_right                                                                   {% ppHelpers.indexOrParams1 %}
                      | %paren_left _ CommaExprList %paren_right                                                                          {% ppHelpers.indexOrParams2 %}
                      | %paren_left _ Expr _ %paren_right                                                                                 {% ppHelpers.indexOrParams3 %}
                      | %paren_left _ %paren_right                                                                                        {% ppHelpers.indexOrParams4 %}

IndexOrParamsListDot -> IndexOrParams IndexOrParamsListDot                                                                                {% ppHelpers.indexOrParamsListDot1 %}
                      | IndexOrParamsDot                                                                                                  {% ppHelpers.indexOrParamsListDot2 %}

IndexOrParamsDot     -> %paren_left _ Expr _ CommaExprList %paren_right_dot                                                               {% ppHelpers.indexOrParamsDot1 %}
                      | %paren_left _ CommaExprList %paren_right_dot                                                                      {% ppHelpers.indexOrParamsDot2 %}
                      | %paren_left _ Expr _ %paren_right_dot                                                                             {% ppHelpers.indexOrParamsDot3 %}
                      | %paren_left _ %paren_right_dot                                                                                    {% ppHelpers.indexOrParamsDot4 %}

CommaExprList        -> %comma _ Expr _ CommaExprList                                                                                     {% ppHelpers.commaExprList1 %}
                      | %comma _ CommaExprList                                                                                            {% ppHelpers.commaExprList2 %}
                      | %comma _ Expr                                                                                                     {% ppHelpers.commaExprList3 %}
                      | %comma                                                                                                            {% ppHelpers.commaExprList4 %}

#========= Redim Statement

RedimStmt            -> %kw_redim __ RedimDeclList NL                                                                                     {% ppRedim.stmt1 %}
                      | %kw_redim __ %kw_preserve __ RedimDeclList NL                                                                     {% ppRedim.stmt2 %}

RedimDeclList        -> RedimDecl _ %comma _ RedimDeclList                                                                                {% ppRedim.redimDeclList1 %}
                      | RedimDecl                                                                                                         {% ppRedim.redimDeclList2 %}

RedimDecl            -> ExtendedID _ %paren_left _ ExprList _ %paren_right                                                                {% ppRedim.redimDecl %}

#========= If Statement

IfStmt               -> %kw_if _ Expr _ %kw_then NL BlockStmtList ElseStmtList %kw_end __ %kw_if NL                                       {% ppIf.stmt1 %}
                      | %kw_if _ Expr _ %kw_then __ InlineStmt _ ElseOpt _ EndIfOpt NL                                                    {% ppIf.stmt2 %}

ElseStmtList         -> %kw_elseif _ Expr _ %kw_then NL BlockStmtList ElseStmtList                                                        {% ppIf.elseStmt1 %}
                      | %kw_elseif _ Expr _ %kw_then __ InlineStmt NL ElseStmtList                                                        {% ppIf.elseStmt2 %}
                      | %kw_else __ InlineStmt NL                                                                                         {% ppIf.elseStmt3 %}
                      | %kw_else NL BlockStmtList                                                                                         {% ppIf.elseStmt4 %}
                      | null                                                                                                              {% data => null %}

ElseOpt              -> %kw_else __ InlineStmt                                                                                            {% ppIf.elseOpt %}
                      | null                                                                                                              {% data => null %}

EndIfOpt             -> %kw_end __ %kw_if
                      | null                                                                                                              {% data => null %}

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

ForStmt              -> %kw_for _ ExtendedID _ %equals _ Expr _ %kw_to _ Expr _ StepOpt NL BlockStmtList %kw_next NL                      {% ppFor.stmt1 %}
                      | %kw_for __ %kw_each _ ExtendedID _ %kw_in _ Expr NL BlockStmtList %kw_next NL                                     {% ppFor.stmt2 %}

StepOpt              -> %kw_step _ Expr                                                                                                   {% ppFor.stepOpt %}
                      | null                                                                                                              {% data => null %}

#========= Select Statement

SelectStmt           -> %kw_select __ %kw_case _ Expr NL CaseStmtList %kw_end __ %kw_select NL                                            {% ppSelect.selectStmt %}

CaseStmtList         -> %kw_case _ ExprList _ NLOpt BlockStmtList CaseStmtList                                                            {% ppSelect.caseStmtList1 %}
                      | %kw_case __ %kw_else _ NLOpt BlockStmtList                                                                        {% ppSelect.caseStmtList2 %}
                      | null                                                                                                              {% data => null %}

NLOpt                -> NL                                                                                                                {% id %}
                      | null                                                                                                              {% data => null %}

ExprList             -> Expr _ %comma _ ExprList                                                                                          {% ppHelpers.exprList1 %}
                      | Expr                                                                                                              {% ppHelpers.exprList2 %}

#===============================
# Rules : Expressions
#===============================

SubSafeExpr          -> SubSafeEqvExpr                                                                                                    {% id %}

SubSafeEqvExpr       -> SubSafeEqvExpr _ %kw_eqv _ XorExpr                                                                                {% ppExpr.eqv %}
                      | SubSafeXorExpr                                                                                                    {% id %}

SubSafeXorExpr       -> SubSafeXorExpr _ %kw_xor _ OrExpr                                                                                 {% ppExpr.xor %}
                      | SubSafeOrExpr                                                                                                     {% id %}

SubSafeOrExpr        -> SubSafeOrExpr _ %kw_or _ AndExpr                                                                                  {% ppExpr.or %}
                      | SubSafeAndExpr                                                                                                    {% id %}

SubSafeAndExpr       -> SubSafeAndExpr _ %kw_and _ NotExpr                                                                                {% ppExpr.and %}
                      | SubSafeNotExpr                                                                                                    {% id %}

SubSafeNotExpr       -> %kw_not _ NotExpr                                                                                                 {% ppExpr.not %}
                      | SubSafeCompareExpr                                                                                                {% id %}

SubSafeCompareExpr   -> SubSafeCompareExpr _ %kw_is _ ConcatExpr                                                                          {% ppExpr.is %}
                      | SubSafeCompareExpr _ %kw_is __ %kw_not _ ConcatExpr                                                               {% ppExpr.isNot %}
                      | SubSafeCompareExpr _ %compare_gte _ ConcatExpr                                                                    {% ppExpr.gte %}
                      | SubSafeCompareExpr _ %compare_lte _ ConcatExpr                                                                    {% ppExpr.lte %}
                      | SubSafeCompareExpr _ %compare_gt _ ConcatExpr                                                                     {% ppExpr.gt %}
                      | SubSafeCompareExpr _ %compare_lt _ ConcatExpr                                                                     {% ppExpr.lt %}
                      | SubSafeCompareExpr _ %compare_gtlt _ ConcatExpr                                                                   {% ppExpr.gtlt %}
                      | SubSafeCompareExpr _ %equals _ ConcatExpr                                                                         {% ppExpr.eq %}
                      | SubSafeConcatExpr                                                                                                 {% id %}

SubSafeConcatExpr    -> SubSafeConcatExpr _ %ampersand _ AddExpr                                                                          {% ppExpr.concat %}
                      | SubSafeAddExpr                                                                                                    {% id %}

SubSafeAddExpr       -> SubSafeAddExpr _ %unary _ ModExpr                                                                                 {% ppExpr.add %}
                      | SubSafeModExpr                                                                                                    {% id %}

SubSafeModExpr       -> SubSafeModExpr _ %kw_mod _ IntDivExpr                                                                             {% ppExpr.mod %}
                      | SubSafeIntDivExpr                                                                                                 {% id %}

SubSafeIntDivExpr    -> SubSafeIntDivExpr _ %int_div _ MultExpr                                                                           {% ppExpr.intDiv %}
                      | SubSafeMultExpr                                                                                                   {% id %}

SubSafeMultExpr      -> SubSafeMultExpr _ %mul_div _ UnaryExpr                                                                            {% ppExpr.mult %}
                      | SubSafeUnaryExpr                                                                                                  {% id %}

SubSafeUnaryExpr     -> %unary _ UnaryExpr                                                                                                {% ppExpr.unary %}
                      | SubSafeExpExpr                                                                                                    {% id %}

SubSafeExpExpr       -> SubSafeValue _ %exponent _ ExpExpr                                                                                {% ppExpr.exp %}
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

CompareExpr          -> CompareExpr _ %kw_is _ ConcatExpr                                                                                 {% ppExpr.is %}
                      | CompareExpr _ %kw_is __ %kw_not _ ConcatExpr                                                                      {% ppExpr.isNot %}
                      | CompareExpr _ %compare_gte _ ConcatExpr                                                                           {% ppExpr.gte %}
                      | CompareExpr _ %compare_lte _ ConcatExpr                                                                           {% ppExpr.lte %}
                      | CompareExpr _ %compare_gt _ ConcatExpr                                                                            {% ppExpr.gt %}
                      | CompareExpr _ %compare_lt _ ConcatExpr                                                                            {% ppExpr.lt %}
                      | CompareExpr _ %compare_gtlt _ ConcatExpr                                                                          {% ppExpr.gtlt %}
                      | CompareExpr _ %equals _ ConcatExpr                                                                                {% ppExpr.eq %}
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

BoolLiteral          -> %kw_true                                                                                                          {% ppLiterals.bool %}
                      | %kw_false                                                                                                         {% ppLiterals.bool %}

IntLiteral           -> %int_literal                                                                                                      {% ppLiterals.int %}
                      | %hex_literal                                                                                                      {% ppLiterals.hex %}
                      | %oct_literal                                                                                                      {% ppLiterals.oct %}

FloatLiteral         -> %float_literal                                                                                                    {% ppLiterals.float %}

StringLiteral        -> %string_literal                                                                                                   {% ppLiterals.string %}

DateLiteral          -> %date_literal                                                                                                     {% ppLiterals.date %}

Nothing              -> %kw_nothing                                                                                                       {% ppLiterals.nothing %}
                      | %kw_null                                                                                                          {% ppLiterals.nothing %}
                      | %kw_empty                                                                                                         {% ppLiterals.nothing %}

#===============================
# Terminals
#===============================

NL                   -> CommentLine                                                                                                       {% ppHelpers.nl %}
                      | %new_line                                                                                                         {% data => null %}

CommentLine          -> %comment_apostophe                                                                                                {% ppHelpers.comment %}

ID                   -> %identifier                                                                                                       {% ppHelpers.id %}
IDDot                -> %identifier_dot                                                                                                   {% ppHelpers.id %}
DotID                -> %dot_identifier                                                                                                   {% ppHelpers.id %}
DotIDDot             -> %dot_identifier_dot                                                                                               {% ppHelpers.id %}

_                    -> %whitespace                                                                                                       {% data => null %}
                      | %whitespace_cont                                                                                                  {% data => null %}
                      | null                                                                                                              {% data => null %}

__                   -> %whitespace                                                                                                       {% data => null %}
