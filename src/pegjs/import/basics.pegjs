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

any
  = !escape c:. { return c; }
  / escape c:. { return '\\' + c; }
