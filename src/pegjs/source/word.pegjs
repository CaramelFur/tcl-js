{
  const {
    EscapePartType,

    AnyWordPart,
    TextPart,
    EscapePart,
    CodePart,
    VariablePart,
  } = require('../../parser/WordToken.ts');
}

singleword = part+

part
  = textPart
  / escapePart
  / variablePart
  / codePart

textPart = chars:textPartChar+ { return new TextPart(chars.join('')); }

textPartChar = !escape !dollarSign !bracketOpen char:. { return char; }

variablePart
  = dollarSign
    variable:(
      chars:variableChar+ !parenthesisOpen {
          return new VariablePart(chars.join(''));
        }
      / name:variableChar*
        parenthesisOpen
        subname:variableIndexPart+
        parenthesisClose { return new VariablePart(name.join(''), subname); }
      / braceOpen name:(!braceClose c:any { return c; })* braceClose {
          return new VariablePart(name.join(''));
        }
    ) { return variable; }

variableIndexPart
  = variableIndexTextPart
  / escapePart
  / variablePart
  / codePart

variableIndexTextPart
  = chars:variableIndexTextPartChar+ { return new TextPart(chars.join('')); }

variableIndexTextPartChar
  = !escape !dollarSign !bracketOpen !parenthesisClose char:. { return char; }

variableChar
  = [a-zA-Z0-9_]
  / namespaceSeparator

codePart = part:rawCodePart { return new CodePart(part.slice(1, -1)); }

rawCodePart
  = bracketOpen
    contents:(!bracketOpen !bracketClose c:any { return c; } / rawCodePart)*
    bracketClose { return '[' + contents.join('') + ']'; }

escapePart
  = escape
    e:(
      normalEscape
      / octalEscape
      / hexEscape
      / unicodeEscape
      / largeUnicodeEscape
    ) { return e; }

normalEscape
  = !octalChar !eightBitHex !sixteenBitHex !thirtytwoBitHex char:. {
      return new EscapePart(char);
    }

octalEscape
  = one:octalChar? two:octalChar? three:octalChar {
      return new new EscapePart(
        (one || '') + (two || '') + three,
        EscapePartType.octal,
      )();
    }

hexEscape
  = eightBitHex high:hexChar? low:hexChar {
      return new EscapePart(high ? high + low : low, EscapePartType.hex);
    }

unicodeEscape
  = sixteenBitHex one:hexChar? two:hexChar? three:hexChar? four:hexChar {
      return new EscapePart(
        (one || '') + (two || '') + (three || '') + four,
        EscapePartType.hex16,
      );
    }

largeUnicodeEscape
  = sixteenBitHex
    one:hexChar?
    two:hexChar?
    three:hexChar?
    four:hexChar?
    five:hexChar?
    six:hexChar?
    seven:hexChar?
    eight:hexChar {
      return new EscapePart(
        (one || '') +
          (two || '') +
          (three || '') +
          (four || '') +
          (five || '') +
          (six || '') +
          (seven || '') +
          eight,
        EscapePartType.hex32,
      );
    }

eightBitHex = "x"

sixteenBitHex = "u"

thirtytwoBitHex = "U"

//import "../import/basics"
