@builtin "whitespace.ne"
@builtin "number.ne"

@{%
const estree = require('./estree');
%}

Program              -> NLOpt GlobalStmt:*                           {% data => estree.program(data[1]) %}

GlobalStmt           -> OptionExplicit
                      | ConstDecl                                    {% data => data[0] %}
                      | BlockStmt                                    {% data => data[0] %}

OptionExplicit       -> "Option" __ "Explicit" NL

BlockStmt            -> VarDecl                                      {% data => data[0] %}

VarDecl              -> "Dim" __ VarName OtherVarsOpt:* NL           {% estree.varDecl %}

VarName              -> ExtendedID ("(" ArrayRankList ")"):?         {% data => data[0] %}

OtherVarsOpt         -> "," __ VarName                               {% data => data[2] %}

ExtendedID           -> SafeKeywordID
                      | ID                                           {% data => data[0] %}

SafeKeywordID        -> "Default"
                      | "Erase"
                      | "Error"
                      | "Explicit"
                      | "Property"
                      | "Step"

ID                   -> Letter IDTail                                {% data => data[0] + data[1] %}
                      | "[" IDNameChar:* "]"

ArrayRankList        -> IntLiteral _ "," _ ArrayRankList
                      | IntLiteral

ConstDecl            -> AccessModifierOpt __ "Const" __ ConstList NL
                      | "Const" __ ConstList NL                      {% estree.constDecl %}

ConstList            -> ExtendedID _ "=" _ ConstExprDef _ "," _ ConstList
                      | ExtendedID _ "=" _ ConstExprDef

ConstExprDef         -> "(" _ ConstExprDef _ ")"
                      | "-" _ ConstExprDef
                      | "+" _ ConstExprDef
                      | ConstExpr                                    {% data => data[0] %}

AccessModifierOpt    -> "Public"
                      | "Private"

ConstExpr            -> FloatLiteral                                 {% data => data[0] %}
                      | Nothing                                      {% data => data[0] %}

Nothing              -> "Nothing"
                      | "Null"
                      | "Empty"

NLOpt                -> NL:*

NL                   -> NewLine NL
                      | NewLine

NewLine              -> CR LF
                      | CR
                      | LF
                      | ":"

IntLiteral           -> DecDigit:+
                      | HexLiteral
                      | OctLiteral

FloatLiteral         -> decimal                                    {% data => data[0] %}  # DecDigit:* "." DecDigit:+ ( "E" [+-]:? DecDigit:+ ):?

HexLiteral           -> "&H" HexDigit:+ "&":?
OctLiteral           -> "&" OctDigit:+ "&":?

DecDigit             -> [0-9]
HexDigit             -> [0-9A-Fa-f]
OctDigit             -> [0-7]

IDNameChar           -> [\x20-\x5A\x5C\x5E-\x7E\xA0]

Letter               -> [a-zA-Z]

LF                   -> [\n]

CR                   -> [\r]

IDTail               -> [a-zA-Z0-9_]:*                               {% data => data[0].join('') %}
