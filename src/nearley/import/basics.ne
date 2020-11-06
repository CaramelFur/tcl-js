@lexer lexer

commandSeperator -> (%nl | %semiColon):+ {% ([seperator]) => seperator.join('') %}

# optional whitespace
_ -> (%ws):* {% ([ws]) => ws ? ws.join('') : '' %}

# mandatory whitespace
__ -> (%ws):+ {% ([ws]) => ws.join('') %}


