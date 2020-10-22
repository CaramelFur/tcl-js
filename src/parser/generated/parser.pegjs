{
  const {
    TclWordPartTypes,
    TclWordTypes,

    TclScript,
    TclCommand,
    TclComment,
    TclWord,
    TclWordPart,
    TclVariable,
  } = require('../TclToken.ts');
}

script = list:statementlist? { return list ? list : new TclScript([]); }

statementlist
  = commandlist
  / commentlist

commandlist
  = firstcommand:command? _ commandSeperator _ otherstatements:statementlist {
      return otherstatements.prepend(firstcommand);
    }
  / firstcommand:command { return new TclScript([firstcommand]); }

commentlist
  = cmnt:comment newLineChar _ otherstatements:statementlist {
      return otherstatements.prepend(cmnt);
    }
  / cmnt:comment { return new TclScript([cmnt]); }

comment = pound chars:nonNewLineChar* { return new TclComment(chars.join('')); }

command = !pound words:commandwords { return words; }

commandwords
  = firstword:word __ otherwords:commandwords {
      return otherwords.prepend(firstword);
    }
  / firstword:word { return new TclCommand([firstword]); }

// Words ========================

word
  = simpleWord
  / quotedWord
  / bracedWord
  / expansionWord

// Simpleword
simpleWord
  = !quote !braceOpen parts:simpleWordPart+ {
      return new TclWord(parts.join(''));
    }

simpleWordPart
  = chars:(
    !bracketOpen !dollarSign !whiteSpaceChar !commandSeperator char:any {
        return char;
      }
  )+ { return chars.join(''); }
  / bracketWordPart
  / variableWordPart

// Quotedword
quotedWord
  = quote parts:quotedWordPart* quote { return new TclWord(parts.join('')); }

quotedWordPart
  = chars:(!bracketOpen !dollarSign !quote char:any { return char; })+ {
      return chars.join('');
    }
  / bracketWordPart
  / variableWordPart

// Bracedword

bracedWord
  = !expansionSymbol chars:rawBracedWord {
      return new TclWord(
        [new TclWordPart(chars.slice(1, -1))],
        TclWordTypes.brace,
      );
    }

rawBracedWord
  = open:braceOpen
    contents:(!braceOpen !braceClose c:any { return c; } / rawBracedWord)*
    close:braceClose { return open + contents.join('') + close; }

expansionWord = expansionSymbol w:word { return w.setExpand(true); }

// Wordparts
bracketWordPart = part:rawBracketWordPart { return part; }

rawBracketWordPart
  = bracketOpen
    contents:(
      !bracketOpen !bracketClose c:any { return c; }
      / rawBracketWordPart
    )*
    bracketClose { return '[' + contents.join('') + ']'; }

variableWordPart
  = dollarSign
    vname:(
      chars:variableChar+ { return '$' + chars.join(''); }
      / name:variableChar*
        parenthesisOpen
        subname:(!parenthesisClose any)*
        parenthesisClose { return '$' + name + '(' + subname + ')'; }
      / braceOpen name:(!braceClose any)* braceClose {
          return '$' + '{' + name.join('') + '}';
        }
    ) { return vname; }

variableChar
  = [a-zA-Z0-9_]
  / namespaceSeparator

// ===========================
// Basic structures

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

whiteSpaceChar = [ \t]

nonWhiteSpaceChar = !whiteSpaceChar c:any { return c; }

newLineChar = [\n\r]

nonNewLineChar = !newLineChar c:any { return c; }

any
  = !escape c:. { return c; }
  / escape c:. { return '\\' + c; }
