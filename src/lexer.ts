import * as Is from './is';
import { TclError } from './tclerror';

export class Lexer {
  pos = 0;
  wordIdx = 0;
  currentChar: string;
  input: string;

  constructor(input: string) {
    this.input = input;
    this.currentChar = input.charAt(0);
  }

  private read(): string {
    let old = this.currentChar;
    this.pos += 1;
    this.currentChar = this.input.charAt(this.pos);
    return old;
  }

  private skipWhitespace() {
    while (Is.Whitespace(this.currentChar)) {
      this.read();
    }
  }

  private skipComment() {
    while (this.pos < this.input.length && this.currentChar !== '\n') {
      this.read();
    }
  }

  private scanWord(delimiterIn?: string): WordToken {
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
          if (delimiters.length === 1) return EndWordType.END;
          delimiters.pop();
          return EndWordType.POPPED;
        }
        return EndWordType.CONTINUE;
      }
      return Is.WordSeparator(test) ? EndWordType.END : EndWordType.CONTINUE;
    }

    while (this.pos < this.input.length) {
      let isEnd = testEndOfWord(this.currentChar);
      if (isEnd === EndWordType.END) {
        if (this.currentChar === delimiters.pop()) this.read();
        break;
      }

      out.hasVariable =
        delimiters.indexOf('}') < 0 &&
        delimiters.indexOf(']') < 0 &&
        (out.hasVariable || this.currentChar === '$');
      out.hasSubExpr =
        delimiters.indexOf('}') < 0 &&
        (out.hasSubExpr || delimiters[0] === ']');

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
        throw new TclError('Parse error: unexpected end of input');
      }
      this.read();
    }

    this.wordIdx += 1;
    return out;
  }

  private skipEndOfCommand() {
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
