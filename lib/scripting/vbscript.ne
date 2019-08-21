@builtin "whitespace.ne"
@builtin "number.ne"

@{%
const estree = require('./estree');
%}

#===============================
# Rules 
#===============================

Program              -> NLOpt GlobalStmt:*                           {% data => estree.program(data[1]) %}

#===============================
# Rules : Declarations
#===============================

VarDecl              -> "Dim" __ VarName OtherVarsOpt:* NL           {% estree.varDecl %}

VarName              -> ExtendedID ("(" ArrayRankList ")"):?         {% data => data[0] %}

OtherVarsOpt         -> "," __ VarName                               {% data => data[2] %}

ArrayRankList        -> IntLiteral _ "," _ ArrayRankList
                      | IntLiteral

ConstDecl            -> AccessModifierOpt __ "Const" __ ConstNameValue OtherConstantsOpt:* NL
                      | "Const" __ ConstNameValue OtherConstantsOpt:* NL                      {% estree.constDecl %}

ConstNameValue       -> ExtendedID _ "=" _ ConstExprDef

OtherConstantsOpt    -> "," _ ConstNameValue                         {% data => data[2] %}

ConstExprDef         -> "(" _ ConstExprDef _ ")"
                      | "-" __ ConstExprDef
                      | "+" __ ConstExprDef
                      | ConstExpr                                    {% id %}

AccessModifierOpt    -> "Public"
                      | "Private"

#===============================
# Rules : Statements
#===============================

GlobalStmt           -> OptionExplicit
                      | ConstDecl                                    {% data => data[0] %}
                      | BlockStmt                                    {% data => data[0] %}

BlockStmt            -> VarDecl                                      {% data => data[0] %}
                      | InlineStmt NL                                {% data => data[0] %}

InlineStmt           -> SubCallStmt                                  {% data => data[0] %}

OptionExplicit       -> "Option" __ "Explicit" NL

SubCallStmt          -> QualifiedID "(" ")"                          {% data => estree.expressionStatement(data) %}
                      | QualifiedID                                  {% data => estree.expressionStatement(data[0]) %}

QualifiedID          -> IDDot QualifiedIDTail                                      
                      | ID                                            
                       
QualifiedIDTail      -> IDDot QualifiedIDTail                        
                      | ID                                           

SafeKeywordID        -> "Default"
                      | "Erase"
                      | "Error"
                      | "Explicit"
                      | "Property"
                      | "Step"

ExtendedID           -> SafeKeywordID
                      | ID                                           {% data => data[0] %}

NLOpt                -> NL:*

#===============================
# Rules : Expressions
#===============================

ConstExpr            -> FloatLiteral                                 {% id %}
                      | StringLiteral                                {% id %}
                      | Nothing                                      {% id %}

Nothing              -> "Nothing"
                      | "Null"
                      | "Empty"

#===============================
# Terminals
#===============================

ID                   -> Letter IDTail                                {% data => data[0] + data[1] %}
                      | "[" IDNameChar:* "]"

IDDot                -> Letter IDTail "."                            {% data => [ data[0] + data[1],  "." ] %}

NL                   -> NewLine NL
                      | NewLine

NewLine              -> CR LF
                      | CR
                      | LF
                      | ":"

IntLiteral           -> DecDigit:+
                      | HexLiteral
                      | OctLiteral

StringLiteral        -> "\"" ( StringChar | "\"\"" ):* "\""          {% data => data[1].join('') %}

FloatLiteral         -> decimal                                      {% id %}  # DecDigit:* "." DecDigit:+ ( "E" [+-]:? DecDigit:+ ):?

HexLiteral           -> "&H" HexDigit:+ "&":?
OctLiteral           -> "&" OctDigit:+ "&":?

DecDigit             -> [0-9]
HexDigit             -> [0-9A-Fa-f]
OctDigit             -> [0-7]

IDNameChar           -> [\x20-\x5A\x5C\x5E-\x7E\xA0]

Letter               -> [a-zA-Z]

LF                   -> [\n]

CR                   -> [\r]

StringChar           -> [\x01-\x21|\x23-\xD7FF|\xE000-\xFFEF]        {% id %}

IDTail               -> [a-zA-Z0-9_]:*                               {% data => data[0].join('') %}