<program> ::= <statement_list>

<statement_list> ::= <statement> | <statement> <statement_list>

<statement> ::= <variable_declaration>
| <assignment>
| <conditional>

<variable_declaration> ::= "var" <data_type> <identifier> "=" <expression> ";"

<assignment> ::= <identifier> "=" <expression> ";"

<conditional> ::= "if" ":" <condition> "{" <statement_list> "}"
| "else if" ":" <condition> "{" <statement_list> "}"
| "else" "{" <statement_list> "}"

<condition> ::= <expression>

<expression> ::= <literal>
| "null"
| <identifier>

<data_type> ::= "int" | "float" | "string" | "bool" |

<identifier> ::= [a-zA-Z\_][a-zA-Z0-9_]\* // Identifiers start with a letter or underscore

<literal> ::= <int_literal>
| <float_literal>
| <string_literal>
| <bool_literal>

<int_literal> ::= [0-9]+
<float_literal> ::= [0-9]+"."[0-9]+
<string_literal> ::= "\"" [^"\n]\* "\"" // Double-quoted string literals
<bool_literal> ::= "true" | "false"
