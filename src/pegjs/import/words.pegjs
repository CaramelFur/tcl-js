words
  = firstword:word __ otherwords:words {
      otherwords.unshift(firstword);
      return otherwords;
    }
  / firstword:word { return [firstword]; }

word
  = nonexpansionWord
  / expansionWord

nonexpansionWord
  = fullSimpleWord
  / quotedWord
  / bracedWord

// Simpleword
fullSimpleWord = !quote !braceOpen w:simpleWord { return w; }

simpleWord = parts:simpleWordPart+ { return new TclWord(parts.join('')); }

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
      return new TclWord(chars.slice(1, -1), TclWordTypes.brace);
    }

rawBracedWord
  = open:braceOpen
    contents:(!braceOpen !braceClose c:any { return c; } / rawBracedWord)*
    close:braceClose { return open + contents.join('') + close; }

expansionWord = expansionSymbol w:nonexpansionWord { return w.setExpand(true); }

// Wordparts
bracketWordPart = part:rawBracketWordPart { return part; }

rawBracketWordPart
  = bracketOpen
    contents:(
      !bracketOpen !bracketClose c:any { return c; }
      / rawBracketWordPart
    )*
    bracketClose { return '[' + contents.join('') + ']'; }

// My fucking god parsing variables is a fucking nightmare
// I'd be a miracle if this doesn't have any inconsistencies with the official interpreter

variableWordPart
  = dollarSign
    vname:(
      chars:variableChar+ !parenthesisOpen { return '$' + chars.join(''); }
      / name:variableChar*
        parenthesisOpen
        subname:variableIndex
        parenthesisClose { return '$' + name.join('') + '(' + subname + ')'; }
      / braceOpen name:(!braceClose c:any { return c; })* braceClose {
          return '$' + '{' + name.join('') + '}';
        }
    ) { return vname; }

variableIndex = parts:variableIndexPart+ { return parts.join(''); }

variableIndexPart
  = chars:(
    !bracketOpen !dollarSign !whiteSpaceChar !parenthesisClose char:any {
        return char;
      }
  )+ { return chars.join(''); }
  / bracketWordPart
  / variableWordPart

variableChar
  = [a-zA-Z0-9_]
  / namespaceSeparator
