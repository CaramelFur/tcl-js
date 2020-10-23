escape = "\\"

pound = "#"

dollarSign = "$"

quote = "\""

braceOpen = "{"

braceClose = "}"

bracketOpen = "["

bracketClose = "]"

parenthesisOpen = "("

parenthesisClose = ")"

expansionSymbol = "{*}"

namespaceSeparator = "::"

semicolon = ";"

commandSeperator = (newLineChar / semicolon)+

// optional whitespace
_ = whiteSpaceChar*

// mandatory whitespace
__ = whiteSpaceChar+

whiteSpaceChar = [ \t\v\f\r]

nonWhiteSpaceChar = !whiteSpaceChar c:any { return c; }

newLineChar = "\n"

nonNewLineChar = !newLineChar c:any { return c; }

octalChar = [0-7]

decimalChar = [0-9]

hexChar = [0-9A-Fa-f]

any
  = !escape c:. { return c; }
  / escape c:. { return '\\' + c; }
