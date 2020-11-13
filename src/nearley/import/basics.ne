@lexer lexer

commandSeperator -> (%nl | %semiColon):+ 
  {% ([seperator]) => ({value: seperator.join(''), line: seperator[0].line, col: seperator[0].col}) %}

# optional whitespace
_ -> (%ws):* {% ([ws]) => ws.length !== 0 ? ({value: ws.join(''), line: ws[0].line, col: ws[0].col}) : null %}

# mandatory whitespace
__ -> (%ws):+ {% ([ws]) => ({value: ws.join(''), line: ws[0].line, col: ws[0].col}) %}


