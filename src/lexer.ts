import * as Is from './is';

export interface ILexer {
  nextToken: () => WordToken | null;
}

export function Lexer(input: string): ILexer {
  let pos = 0;
  let c = input.charAt(0);
  let wordIdx = 0;

  function read(): string {
    const val = c;
    pos += 1;
    c = input.charAt(pos);
    return val;
  }

  function skipWhitespace() {
    while (Is.Whitespace(c)) {
      read();
    }
  }

  function skipComment() {
    while (pos < input.length && c !== '\n') {
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

    while (pos < input.length && !testEndOfWord(c)) {
      hasVariable = delimiter !== '}' && (hasVariable || c === '$');
      hasSubExpr = delimiter !== '}' && (hasSubExpr || c === '[');
      value += read();
    }

    if (delimiter) {
      if (!testEndOfWord(c)) {
        throw new Error('Parse error: unexpected end of input');
      }
      read();
    }

    wordIdx += 1;
    return new WordToken({ value, index, hasVariable, hasSubExpr });
  }

  function skipEndOfCommand() {
    while (Is.CommandDelimiter(c) || Is.Whitespace(c)) {
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
      case wordIdx === 0 && c === '#':
        skipComment();
        return nextToken();
      case Is.CommandDelimiter(c):
        skipEndOfCommand();
        return nextToken();
      case c === '"':
        read();
        return scanWord('"');
      case c === '{':
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
