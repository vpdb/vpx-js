@preprocessor typescript
@builtin "whitespace.ne"
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
                      | _ BlockStmt                                                                                {% data => data[1] %} 

BlockStmt            -> DimDecl                                                                                    {% id %}
                      | _ InlineStmt NL                                                                            {% data => data[1] %}

InlineStmt           -> AssignStmt                                                                                 {% id %}
                      | SubCallStmt                                                                                {% id %}

OptionExplicit       -> "Option" __ "Explicit" NL                                                                  {% pp.optionExplicit %}

AssignStmt           -> LeftExpr _ "=" _ Expr                                                                      {% pp.assignStmt %}
#                      | "Set" LeftExpr _ "=" _ Expr
#                      | "Set" LeftExpr _ "=" _ "New" _ LeftExpr


SubCallStmt          -> QualifiedID __ SubSafeExprOpt _ CommaExprList:*                                            {% pp.subCallStmt %}
#                      | QualifiedID "(" ")"
                      | QualifiedID                                                                                {% pp.subCallStmt %}

LeftExpr             -> QualifiedID                                                                                {% id %}
#                      | QualifiedID IndexOrParamsList "." LeftExprTail
#                      | QualifiedID IndexOrParamsListDot LeftExprTail
#                      | QualifiedID IndexOrParamsList
#                      | SafeKeywordID

CommaExprList        -> "," _ Expr                                                                                 {% data => data[2] %}

SubSafeExprOpt       -> SubSafeExpr                                                                                {% id %}

QualifiedID          -> IDDot QualifiedIDTail                                                                      {% data => estree.memberExpression(data[0], data[1]) %}
                      | ID                                                                                         {% id %}

QualifiedIDTail      -> IDDot QualifiedIDTail
                      | ID                                                                                         {% id %}

SafeKeywordID        -> "Default"
                      | "Erase"
                      | "Error"
                      | "Explicit"
                      | "Property"
                      | "Step"

ExtendedID           -> SafeKeywordID
                      | ID                                                                                         {% id %}

NLOpt                -> NL:*

#===============================
# Rules : Expressions
#===============================

SubSafeExpr          -> SubSafeValue                                                                               {% id %}

SubSafeValue         -> ConstExpr                                                                                  {% id %}
#                      | LeftExpr                                      
#                      | "(" _ Expr _ ")"

Expr                 -> ImpExpr                                                                                    {% id %}

ImpExpr              -> AddExpr                                                                                    {% id %}
#                      | ImpExpr _ "Imp" _ AddExpr

AddExpr              -> AddExpr _ "+" _ ModExpr                                                                    {% data => estree.binaryExpression('+', data[0], data[4]) %}
                      | AddExpr _ "-" _ ModExpr                                                                    {% data => estree.binaryExpression('-', data[0], data[4]) %}
                      | ModExpr                                                                                    {% id %}

ModExpr              -> ModExpr _ "Mod" _ IntDivExpr                                                               {% data => estree.binaryExpression('%', data[0], data[4]) %}
                      | IntDivExpr                                                                                 {% id %}

IntDivExpr           -> IntDivExpr _ "\\" _ MultExpr                                                               {% data => estree.binaryExpression('/', data[0], data[4]) %}
                      | MultExpr                                                                                   {% id %}

MultExpr             -> MultExpr _ "*" _ UnaryExpr                                                                 {% data => estree.binaryExpression('*', data[0], data[4]) %}
                      | MultExpr _ "/" _ UnaryExpr                                                                 {% data => estree.binaryExpression('/', data[0], data[4]) %}
                      | UnaryExpr                                                                                  {% id %}

UnaryExpr            -> "-" UnaryExpr                                                                              {% data => estree.unaryExpression(data[0], data[1]) %}
                      | "+" UnaryExpr                                                                              {% data => estree.unaryExpression(data[0], data[1]) %}
                      | ExpExpr                                                                                    {% id %}

ExpExpr              -> Value                                                                                      {% id %}
#                      | Value "^" ExpExpr                                                                                      

Value                -> ConstExpr                                                                                  {% id %}
                      | LeftExpr                                                                                   {% id %}
#                      | "(" _ Expr _ ")"

ConstExpr            -> IntLiteral                                                                                 {% data => estree.literal(data[0]) %}
                      | FloatLiteral                                                                               {% data => estree.literal(data[0]) %}
                      | StringLiteral                                                                              {% data => estree.literal(data[0]) %}
                      | Nothing                                                                                    {% id %}

Nothing              -> "Nothing"                                                                                  {% id %}
                      | "Null"                                                                                     {% id %}
                      | "Empty"                                                                                    {% id %}

#===============================
# Terminals
#===============================

ID                   -> Letter IDTail                                                                              {% data => estree.identifier(data[0] + data[1]) %}
#                      | "[" IDNameChar:* "]"

IDDot                -> Letter IDTail "."                                                                          {% data => estree.identifier(data[0] + data[1]) %}

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
