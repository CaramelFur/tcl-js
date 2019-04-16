import * as Is from './is';

export interface ILexer {
  nextToken: () => WordToken | null;
}

export function Lexer(input: string): ILexer {
  let pos = 0;
  let currentChar = input.charAt(0);
  let wordIdx = 0;

  function read(): string {
    const val = currentChar;
    pos += 1;
    currentChar = input.charAt(pos);
    return val;
  }

  function skipWhitespace() {
    while (Is.Whitespace(currentChar)) {
      read();
    }
  }

  function skipComment() {
    while (pos < input.length && currentChar !== '\n') {
      read();
    }
  }

  function scanWord(delimiter?: string): WordToken {
    let value = '';
    let hasVariable = false;
    let hasSubExpr = false;
    const index = wordIdx;
    const testEndOfWord: Function = delimiter
      ? (ch: string) => ch === delimiter
      : Is.WordSeparator;

    while (pos < input.length && !testEndOfWord(currentChar)) {
      hasVariable = delimiter !== '}' && (hasVariable || currentChar === '$');
      hasSubExpr = delimiter !== '}' && (hasSubExpr || currentChar === '[');
      value += read();
    }

    if (delimiter) {
      if (!testEndOfWord(currentChar)) {
        throw new Error('Parse error: unexpected end of input');
      }
      read();
    }

    wordIdx += 1;
    return new WordToken({ value, index, hasVariable, hasSubExpr });
  }

  function skipEndOfCommand() {
    while (Is.CommandDelimiter(currentChar) || Is.Whitespace(currentChar)) {
      read();
    }
    wordIdx = 0;
  }

  function nextToken(): WordToken | null {
    skipWhitespace();
    if (pos >= input.length) {
      return null;
    }
    switch (true) {
      case wordIdx === 0 && currentChar === '#':
        skipComment();
        return nextToken();
      case Is.CommandDelimiter(currentChar):
        skipEndOfCommand();
        return nextToken();
      case currentChar === '"':
        read();
        return scanWord('"');
      case currentChar === '{':
        read();
        return scanWord('}');
      default:
        return scanWord();
    }
  }

  return { nextToken };
}

export class WordToken {
  type: string = 'Word';
  index: any;
  value: any;
  hasVariable: boolean = false;

  constructor(attrs: any) {
    Object.assign(this, attrs);
  }
}
