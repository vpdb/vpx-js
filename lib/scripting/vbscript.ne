@builtin "whitespace.ne"

@{%
const estree = require('./estree');
%}

Program              -> NLOpt GlobalStmt:*                           {% data => estree.program(data[1]) %}

GlobalStmt           -> OptionExplicit
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

ArrayRankList        -> IntLiteral "," ArrayRankList
                      | IntLiteral

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
