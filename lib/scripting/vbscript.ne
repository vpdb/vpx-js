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

Program              -> NLOpt GlobalStmt:*                            {% data => estree.program(data[1]) %}

#===============================
# Rules : Declarations
#===============================

VarDecl              -> "Dim" __ VarName OtherVarsOpt:* NL            {% pp.varDecl %}

VarName              -> ExtendedID ("(" ArrayRankList ")"):?          {% id %}

OtherVarsOpt         -> "," __ VarName                                {% data => data[2] %}

ArrayRankList        -> IntLiteral _ "," _ ArrayRankList
                      | IntLiteral

ConstDecl            -> AccessModifierOpt __ "Const" __ ConstNameValue OtherConstantsOpt:* NL
                      | "Const" __ ConstNameValue OtherConstantsOpt:* NL    {% pp.constDecl %}

ConstNameValue       -> ExtendedID _ "=" _ ConstExprDef

OtherConstantsOpt    -> "," _ ConstNameValue                          {% data => data[2] %}

ConstExprDef         -> "(" _ ConstExprDef _ ")"
                      | "-" ConstExprDef                              {% data => estree.unaryExpression(data[0], data[1]) %}
                      | "+" ConstExprDef                              {% data => estree.unaryExpression(data[0], data[1]) %}
                      | ConstExpr                                     {% id %}

AccessModifierOpt    -> "Public"                                      {% id %}
                      | "Private"                                     {% id %}

#===============================
# Rules : Statements
#===============================

GlobalStmt           -> OptionExplicit                                {% id %}
                      | ConstDecl                                     {% id %}
                      | BlockStmt                                     {% id %}

BlockStmt            -> VarDecl                                       {% id %}
                      | InlineStmt NL                                 {% id %}

InlineStmt           -> SubCallStmt                                   {% id %}

OptionExplicit       -> "Option" __ "Explicit" NL                           {% pp.optionExplicit %}

SubCallStmt          -> QualifiedID __ SubSafeExprOpt _ CommaExprList:*     {% pp.subCallStmt %}
#                      | QualifiedID "(" ")"
                     | QualifiedID                                          {% pp.subCallStmt %}

CommaExprList        -> "," _ Expr                                    {% data => data[2] %}

SubSafeExprOpt       -> SubSafeExpr                                   {% id %}

QualifiedID          -> IDDot QualifiedIDTail                         {% data => estree.memberExpression(data[0], data[1]) %}
                      | ID                                            {% id %}

QualifiedIDTail      -> IDDot QualifiedIDTail
                      | ID                                            {% id %}

SafeKeywordID        -> "Default"
                      | "Erase"
                      | "Error"
                      | "Explicit"
                      | "Property"
                      | "Step"

ExtendedID           -> SafeKeywordID                                 {% id %}
                      | ID                                            {% id %}

NLOpt                -> NL:*

#===============================
# Rules : Expressions
#===============================

SubSafeExpr          -> SubSafeValue                                  {% id %}

SubSafeValue         -> ConstExpr                                     {% id %}
#                      | LeftExpr                                      {% id %}
#                      | "(" _ Expr _ ")"

Expr                 -> UnaryExpr                                     {% id %}

UnaryExpr            -> "-" UnaryExpr                                 {% data => estree.unaryExpression(data[0], data[1]) %}
                      | "+" UnaryExpr                                 {% data => estree.unaryExpression(data[0], data[1]) %}
                      | ExpExpr                                       {% id %}

ExpExpr              -> Value "^" ExpExpr
                      | Value                                         {% id %}

Value                -> ConstExpr                                     {% id %}
#                      | LeftExpr                                      {% id %}
                      | "(" _ Expr _ ")"

ConstExpr            -> IntLiteral                                    {% data => estree.literal(data[0]) %}
                      | FloatLiteral                                  {% data => estree.literal(data[0]) %}
                      | StringLiteral                                 {% data => estree.literal(data[0]) %}
                      | Nothing                                       {% id %}

Nothing              -> "Nothing"                                     {% id %}
                      | "Null"                                        {% id %}
                      | "Empty"                                       {% id %}

#===============================
# Terminals
#===============================

ID                   -> Letter IDTail                                 {% data => data[0] + data[1] %}
                      | "[" IDNameChar:* "]"

IDDot                -> Letter IDTail "."                             {% data => data[0] + data[1] %}

NL                   -> NewLine NL
                      | NewLine

NewLine              -> CR LF
                      | CR
                      | LF
                      | ":"

IntLiteral           -> unsigned_int                                  {% id %}
                      | HexLiteral
                      | OctLiteral

StringLiteral        -> "\"" ( StringChar | "\"\"" ):* "\""           {% data => data[1].join('') %}

FloatLiteral         -> decimal                                       {% id %}  # DecDigit:* "." DecDigit:+ ( "E" [+-]:? DecDigit:+ ):?

HexLiteral           -> "&H" HexDigit:+ "&":?
OctLiteral           -> "&" OctDigit:+ "&":?

DecDigit             -> [0-9]
HexDigit             -> [0-9A-Fa-f]
OctDigit             -> [0-7]

IDNameChar           -> [\x20-\x5A\x5C\x5E-\x7E\xA0]

Letter               -> [a-zA-Z]

LF                   -> [\n]

CR                   -> [\r]

StringChar           -> [\x01-\x21|\x23-\xD7FF|\xE000-\xFFEF]         {% id %}

IDTail               -> [a-zA-Z0-9_]:*                                {% data => data[0].join('') %}
