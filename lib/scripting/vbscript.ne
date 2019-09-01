@preprocessor typescript
@builtin "number.ne"

@{%
const estree = require('./estree');
const pp = require('./post-process');
%}

#===============================
# Rules
#===============================

Program              -> NLOpt GlobalStmt:*                                                                         {% data => estree.program(data[1]) %}

#===============================
# Rules : Declarations
#===============================

DimDecl              -> "Dim" __ DimVarList NL                                                                     {% pp.dimDecl %}

DimVarList           -> DimVarName DimOtherVars:*                                                                  {% pp.dimVarList %} 

DimVarName           -> ExtendedID ("(" ArrayRankList ")"):?                                                       {% id %}

DimOtherVars         -> "," _ DimVarName                                                                           {% data => data[2] %}

ArrayRankList        -> IntLiteral _ "," _ ArrayRankList
                      | IntLiteral

ConstDecl            -> "Const" __ ConstVarList NL                                                                 {% pp.constDecl %}
#                      | AccessModifierOpt __ "Const" __ ConstVarList NL

ConstVarList         -> ConstVarNameValue ConstOtherVars:*                                                         {% pp.constVarList %} 

ConstOtherVars       -> "," _ ConstVarNameValue                                                                    {% data => data[2] %}

ConstVarNameValue    -> ExtendedID _ "=" _ ConstExprDef

ConstExprDef         -> "-" ConstExprDef                                                                           {% data => estree.unaryExpression(data[0], data[1]) %}
                      | "+" ConstExprDef                                                                           {% data => estree.unaryExpression(data[0], data[1]) %}
                      | ConstExpr                                                                                  {% id %}
#                      | "(" _ ConstExprDef _ ")"

SubDecl              -> "Sub" __ ExtendedID MethodArgList:? NL MethodStmt:* _ "End" __ "Sub" NL                    {% pp.subDecl %}
#                      | "Sub" __ ExtendedID MethodArgList:? InlineStmt "End" __ "Sub" NL                             
#                      | MethodAccessOpt __ "Sub" __ ExtendedID MethodArgList:* NL MethodStmt:* "End" __ "Sub" NL     
#                      | MethodAccessOpt __ "Sub" __ ExtendedID MethodArgList:* InlineStmt "End" __ "Sub" NL          

#MethodAccessOpt      -> "Public" __ "Default"
#                      | AccessModifierOpt

#AccessModifierOpt    -> "Public"                                                                                   {% id %}
#                      | "Private"                                                                                  {% id %}

MethodArgList        -> "(" _ Arg OtherArgsOpt:* _ ")"                                                             {% pp.methodArgList %}      
                      | "(" ")"                                                                                    {% pp.methodArgList %}

OtherArgsOpt         -> "," _ Arg                                                                                  {% data => data[2] %}

Arg                  -> ExtendedID                                                                                 {% id %}
#                      | ArgModifierOpt __ ExtendedID "(" ")"
#                      | ArgModifierOpt __ ExtendedID
#                      | ExtendedID "(" ")"
                      
#ArgModifierOpt       -> "ByVal"
#                      | "ByRef"

#===============================
# Rules : Statements
#===============================

GlobalStmt           -> OptionExplicit                                                                             {% id %}
                      | ConstDecl                                                                                  {% id %}
                      | SubDecl                                                                                    {% id %}
                      | BlockStmt                                                                                  {% id %}

MethodStmt           -> ConstDecl                                                                                  {% id %}
                      | BlockStmt                                                                                  {% id %}

BlockStmt            -> DimDecl                                                                                    {% id %}
                      | IfStmt                                                                                     {% id %}
                      | WithStmt                                                                                   {% id %}
                      | LoopStmt                                                                                   {% id %}
                      | ForStmt                                                                                    {% id %}
                      | InlineStmt NL                                                                              {% id %}

InlineStmt           -> AssignStmt                                                                                 {% id %}
                      | SubCallStmt                                                                                {% id %}

OptionExplicit       -> "Option" __ "Explicit" NL                                                                  {% pp.optionExplicit %}

AssignStmt           -> LeftExpr _ "=" _ Expr                                                                      {% pp.assignStmt %}
#                      | "Set" LeftExpr _ "=" _ Expr
#                      | "Set" LeftExpr _ "=" _ "New" _ LeftExpr


SubCallStmt          -> QualifiedID _ SubSafeExpr:? _ CommaExprList:*                                              {% pp.subCallStmt %}
                       | QualifiedID _ SubSafeExpr:?                                                               {% pp.subCallStmt %}
#                      | QualifiedID "(" ")"

LeftExpr             -> QualifiedID                                                                                {% id %}
#                      | QualifiedID IndexOrParamsList "." LeftExprTail
#                      | QualifiedID IndexOrParamsListDot LeftExprTail
#                      | QualifiedID IndexOrParamsList
                      | SafeKeywordID                                                                              {% id %}

QualifiedID          -> IDDot QualifiedIDTail                                                                      {% data => estree.memberExpression(data[0], data[1]) %}
#                      | DotIDDot QualifiedIDTail
                      | ID                                                                                         {% id %}
                      | DotID                                                                                      {% id %}
                      

QualifiedIDTail      -> IDDot QualifiedIDTail
                      | ID                                                                                         {% id %}
                      | KeywordID                                                                                  {% id %}

KeywordID            -> SafeKeywordID                                                                              {% id %}
                      | "Do"                                                                                       {% id %}

SafeKeywordID        -> "Default"                                                                                  {% id %}
                      | "Erase"                                                                                    {% id %}
                      | "Error"                                                                                    {% id %}
                      | "Explicit"                                                                                 {% id %}
                      | "Property"                                                                                 {% id %}
                      | "Step"                                                                                     {% id %}

ExtendedID           -> SafeKeywordID                                                                              {% id %}
                      | ID                                                                                         {% id %}

CommaExprList        -> "," _ Expr                                                                                 {% data => data[2] %}

#========= If Statement

IfStmt               -> "If" _ Expr _ "Then" NL BlockStmt:* ElseStmt:? _ "End" _ "If" NL                           {% pp.ifStmt %}
#                      | "If" _ Expr _ "Then" _ InlineStmt ElseOpt:? EndIfOpt:? NL

ElseStmt             -> "ElseIf" _ Expr _ "Then" NL BlockStmt:* ElseStmt:?                                         {% pp.ifStmt %}
#                      | "ElseIf" _ Expr _ "Then" _ InlineStmt NL ElseStmt:?
                      | "Else" NL BlockStmt:*                                                                      {% data => estree.blockStatement(data[2]) %}

#ElseOpt              -> "Else" _ InlineStmt                                                                        {% data => data[2] %}

#EndIfOpt             -> "End" _ "If"

#========= With Statement

WithStmt             -> "With" _ Expr NL BlockStmt:* _ "End" _ "With" NL                                           {% pp.withStmt %}

#========= Loop Statement
 
LoopStmt             -> "Do" _ LoopType _ Expr NL BlockStmt:* _ "Loop" NL                                          {% pp.doWhileLoopStmt %}
                      | "Do" NL BlockStmt:* _ "Loop" _ LoopType _ Expr NL                                          {% pp.doLoopWhileStmt %}
                      | "Do" NL BlockStmt:* _ "Loop" NL                                                            {% pp.doLoopStmt %}
                      | "While" _ Expr NL BlockStmt:* _ ("WEnd"|"Wend") NL                                         {% pp.whileLoopStmt %}

LoopType             -> "While"                                                                                    {% id %}
                      | "Until"                                                                                    {% id %}

#========= For Statement

ForStmt              -> "For" _ ExtendedID _ "=" _ Expr _ "To" _ Expr _ StepOpt:? NL BlockStmt:* _ "Next" NL       {% pp.forStmt %}
                      | "For" _ "Each" _ ExtendedID _ "In" _ Expr NL BlockStmt:* _ "Next" NL                       {% pp.forEachStmt %}

StepOpt              -> "Step" _ Expr                                                                              {% data => data[2] %}

#===============================
# Rules : Expressions
#===============================

SubSafeExpr          -> SubSafeValue                                                                               {% id %}

SubSafeValue         -> ConstExpr                                                                                  {% id %}
#                      | LeftExpr                                      
#                      | "(" _ Expr _ ")"

Expr                 -> EqvExpr                                                                                    {% id %}

EqvExpr              -> EqvExpr _ "Eqv" _ XorExpr                                                                  {% pp.eqvExpr %}
                      | XorExpr                                                                                    {% id %}

XorExpr              -> XorExpr _ "Xor" _ OrExpr                                                                   {% data => estree.binaryExpression('^', data[0], data[4]) %}
                      | OrExpr                                                                                     {% id %} 

OrExpr               -> OrExpr _ "Or" _ AndExpr                                                                    {% data => estree.binaryExpression('|', data[0], data[4]) %}
                      | AndExpr                                                                                    {% id %}

AndExpr              -> AndExpr _ "And" _ NotExpr                                                                  {% data => estree.binaryExpression('&', data[0], data[4]) %}
                      | NotExpr                                                                                    {% id %}

NotExpr              -> "Not" _ NotExpr                                                                            {% data => estree.unaryExpression('~', data[2]) %}
                      | CompareExpr                                                                                {% id %}

CompareExpr          -> CompareExpr _ "Is" _ AddExpr                                                               {% data => estree.binaryExpression('==', data[0], data[4]) %}
                      | CompareExpr _ "Is" __ "Not" _ AddExpr                                                      {% data => estree.binaryExpression('!=', data[0], data[6]) %}
                      | CompareExpr _ ">=" _ AddExpr                                                               {% data => estree.binaryExpression('>=', data[0], data[4]) %}
                      | CompareExpr _ "=>" _ AddExpr                                                               {% data => estree.binaryExpression('=>', data[0], data[4]) %}
                      | CompareExpr _ "<=" _ AddExpr                                                               {% data => estree.binaryExpression('<=', data[0], data[4]) %}
                      | CompareExpr _ "=<" _ AddExpr                                                               {% data => estree.binaryExpression('=<', data[0], data[4]) %}
                      | CompareExpr _ ">"  _ AddExpr                                                               {% data => estree.binaryExpression('>', data[0], data[4]) %}
                      | CompareExpr _ "<"  _ AddExpr                                                               {% data => estree.binaryExpression('<', data[0], data[4]) %}
                      | CompareExpr _ "<>" _ AddExpr                                                               {% data => estree.binaryExpression('!=', data[0], data[4]) %}
                      | CompareExpr _ "=" _ AddExpr                                                                {% data => estree.binaryExpression('==', data[0], data[4]) %}
                      | AddExpr                                                                                    {% id %}

AddExpr              -> AddExpr _ "+" _ ModExpr                                                                    {% data => estree.binaryExpression('+', data[0], data[4]) %}
                      | AddExpr _ "-" _ ModExpr                                                                    {% data => estree.binaryExpression('-', data[0], data[4]) %}
                      | ModExpr                                                                                    {% id %}

ModExpr              -> ModExpr _ "Mod" _ IntDivExpr                                                               {% data => estree.binaryExpression('%', data[0], data[4]) %}
                      | IntDivExpr                                                                                 {% id %}

IntDivExpr           -> IntDivExpr _ "\\" _ MultExpr                                                               {% pp.intDivExpr %}
                      | MultExpr                                                                                   {% id %}

MultExpr             -> MultExpr _ "*" _ UnaryExpr                                                                 {% data => estree.binaryExpression('*', data[0], data[4]) %}
                      | MultExpr _ "/" _ UnaryExpr                                                                 {% data => estree.binaryExpression('/', data[0], data[4]) %}
                      | UnaryExpr                                                                                  {% id %}

UnaryExpr            -> "-" UnaryExpr                                                                              {% data => estree.unaryExpression(data[0], data[1]) %}
                      | "+" UnaryExpr                                                                              {% data => estree.unaryExpression(data[0], data[1]) %}
                      | ExpExpr                                                                                    {% id %}

ExpExpr              -> Value _ "^" _ ExpExpr                                                                      {% pp.expExpr %}
                      | Value                                                                                      {% id %}

Value                -> ConstExpr                                                                                  {% id %}
                      | LeftExpr                                                                                   {% id %}
#                      | "(" _ Expr _ ")"

ConstExpr            -> BoolLiteral                                                                                {% id %}
                      | IntLiteral                                                                                 {% data => estree.literal(data[0]) %}
                      | FloatLiteral                                                                               {% data => estree.literal(data[0]) %}
                      | StringLiteral                                                                              {% data => estree.literal(data[0]) %}
                      | Nothing                                                                                    {% id %}

BoolLiteral          -> "True"                                                                                     {% data => estree.literal(true) %}
                      | "False"                                                                                    {% data => estree.literal(false) %}

Nothing              -> "Nothing"                                                                                  {% data => estree.literal(null) %}
                      | "Null"                                                                                     {% data => estree.literal(null) %}
                      | "Empty"                                                                                    {% data => estree.literal(null) %}

#===============================
# Terminals
#===============================

NLOpt                -> NL:?

ID                   -> Letter IDTail                                                                              {% data => estree.identifier(data[0] + data[1]) %}
#                      | "[" IDNameChar:* "]"

IDDot                -> Letter IDTail "."                                                                          {% data => estree.identifier(data[0] + data[1]) %}

DotID                -> "." Letter IDTail                                                                          {% data => estree.identifier("." + data[1] + data[2]) %}
#                      | '.' '[' {ID Name Char}* ']'

NL                   -> NewLine NL
                      | NewLine

NewLine              -> CR LF
                      | CR
                      | LF
                      | ":"

IntLiteral           -> unsigned_int                                                                               {% id %}
                      | HexLiteral
                      | OctLiteral

StringLiteral        -> "\"" ( StringChar | "\"\"" ):* "\""                                                        {% data => data[1].join('') %}

FloatLiteral         -> decimal                                                                                    {% id %}  # DecDigit:* "." DecDigit:+ ( "E" [+-]:? DecDigit:+ ):?

HexLiteral           -> "&H" HexDigit:+ "&":?
OctLiteral           -> "&" OctDigit:+ "&":?

DecDigit             -> [0-9]
HexDigit             -> [0-9A-Fa-f]
OctDigit             -> [0-7]

IDNameChar           -> [\x20-\x5A\x5C\x5E-\x7E\xA0]

Letter               -> [a-zA-Z]

LF                   -> [\n]

CR                   -> [\r]

StringChar           -> [\x01-\x21|\x23-\xD7FF|\xE000-\xFFEF]                                                      {% id %}

IDTail               -> [a-zA-Z0-9_]:*                                                                             {% data => data[0].join('') %}

_                    -> wschar:*                                                                                   {% data => null %}
__                   -> wschar:+                                                                                   {% data => null %}

wschar               -> [ \t\v\f]                                                                                  {% id %}

