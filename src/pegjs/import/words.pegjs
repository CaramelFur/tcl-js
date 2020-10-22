words
  = firstword:word __ otherwords:words {
      otherwords.unshift(firstword)
      return otherwords;
    }
  / firstword:word { return [firstword] }

word
  = nonexpansionWord
  / expansionWord

nonexpansionWord
  = simpleWord
  / quotedWord
  / bracedWord

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
        chars.slice(1, -1),
        TclWordTypes.brace,
      );
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