@lexer lexer

commandSeperator -> (%nl | %semiColon):+

# optional whitespace
_ -> (%ws):*

# mandatory whitespace
__ -> (%ws):+

octalChar -> [0-7]

decimalChar -> [0-9]

hexChar -> [0-9A-Fa-f]

