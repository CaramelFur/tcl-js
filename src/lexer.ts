import * as Is from './is';

export class LineLexer {
  pos = 0;
  wordIdx = 0;
  currentChar: string;
  input: string;

  constructor(input: string) {
    this.input = input;
    this.currentChar = input.charAt(0);
  }

  read(): string {
    let old = this.currentChar;
    this.pos += 1;
    this.currentChar = this.input.charAt(this.pos);
    return old;
  }

  skipWhitespace() {
    while (Is.Whitespace(this.currentChar)) {
      this.read();
    }
  }

  skipComment() {
    while (this.pos < this.input.length && this.currentChar !== '\n') {
      this.read();
    }
  }

  scanWord(delimiterIn?: string): WordToken {
    let delimiters: Array<string> = [];
    if (delimiterIn) delimiters.push(delimiterIn);

    let out: WordToken = {
      value: '',
      hasVariable: false,
      hasSubExpr: false,
      index: this.wordIdx,
    };

    function testDelimiters(test: string): number {
      switch (test) {
        case '{':
          delimiters.push('}');
          return delimiters.length;
        case '"':
          delimiters.push('"');
          return delimiters.length;
        case '[':
          delimiters.push(']');
          return delimiters.length;
      }
      return 0;
    }

    function testEndOfWord(test: string): EndWordType {
      if (delimiters.length > 0) {
        let delimiter = delimiters[delimiters.length - 1];
        if (test === delimiter) {
          delimiters.pop();
          if (delimiters.length === 0) return EndWordType.END;
          return EndWordType.POPPED;
        }
        return EndWordType.CONTINUE;
      }
      return Is.WordSeparator(test) ? EndWordType.END : EndWordType.CONTINUE;
    }

    while (this.pos < this.input.length) {
      let isEnd = testEndOfWord(this.currentChar);
      if (isEnd === EndWordType.END) {
        this.read();
        break;
      }

      out.hasVariable =
        delimiters[0] !== '}' && (out.hasVariable || this.currentChar === '$');
      out.hasSubExpr =
        delimiters[0] !== '}' && (out.hasSubExpr || this.currentChar === '[');

      if (isEnd !== EndWordType.POPPED) {
        let newLength = testDelimiters(this.currentChar);
        if (newLength === 1) {
          this.read();
          continue;
        }
      }

      out.value += this.read();
    }

    if (delimiters.length > 0) {
      if (!testEndOfWord(this.currentChar)) {
        console.log(delimiters);
        throw new Error('Parse error: unexpected end of input');
      }
      this.read();
    }

    this.wordIdx += 1;
    return out;
  }

  skipEndOfCommand() {
    while (
      Is.CommandDelimiter(this.currentChar) ||
      Is.Whitespace(this.currentChar)
    ) {
      this.read();
    }
    this.wordIdx = 0;
  }

  nextToken(): WordToken | null {
    this.skipWhitespace();
    if (this.pos >= this.input.length) {
      return null;
    }
    switch (true) {
      case this.wordIdx === 0 && this.currentChar === '#':
        this.skipComment();
        return this.nextToken();
      case Is.CommandDelimiter(this.currentChar):
        this.skipEndOfCommand();
        return this.nextToken();
      default:
        return this.scanWord();
    }
  }
}

export interface WordToken {
  value: string;
  index: number;
  hasVariable: boolean;
  hasSubExpr: boolean;
}

enum EndWordType {
  CONTINUE,
  END,
  POPPED,
}
