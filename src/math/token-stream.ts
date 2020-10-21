import { Token, TokenTypes } from './token';
import { Parser, opsHolder } from './parser';

let optionNameMap: { [index: string]: string } = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '%': 'remainder',
  '**': 'power',
  '<': 'comparison',
  '>': 'comparison',
  '<=': 'comparison',
  '>=': 'comparison',
  '==': 'comparison',
  '!=': 'comparison',
  '&&': 'logical',
  '||': 'logical',
  '!': 'logical',
  '?': 'conditional',
  ':': 'conditional',
  '~': 'bitwise',
  '>>': 'bitwise',
  '<<': 'bitwise',
  '|': 'bitwise',
  '&': 'bitwise',
};

let codePointPattern = /^[0-9a-f]{4}$/i;

export class TokenStream {
  pos: number = 0;
  current: Token = this.newToken(TokenTypes.TEOF, 'EOF');
  unaryOps: opsHolder;
  binaryOps: opsHolder;
  ternaryOps: opsHolder;
  consts: { [index: string]: string | number | boolean };
  expression: string;
  savedPosition: number = 0;
  savedCurrent: Token = this.current;
  options: { [index: string]: any };

  constructor(parser: Parser, expression: string) {
    this.unaryOps = parser.unaryOps;
    this.binaryOps = parser.binaryOps;
    this.ternaryOps = parser.ternaryOps;
    this.consts = parser.consts;
    this.expression = expression;
    this.options = parser.options;
  }

  public newToken(type: TokenTypes, value: any, pos?: number) {
    return new Token(type, value, pos != null ? pos : this.pos);
  }

  public save() {
    this.savedPosition = this.pos;
    this.savedCurrent = this.current;
  }

  public restore() {
    this.pos = this.savedPosition;
    this.current = this.savedCurrent;
  }

  public next(): Token {
    if (this.pos >= this.expression.length) {
      return this.newToken(TokenTypes.TEOF, 'EOF');
    }

    if (this.isWhitespace() || this.isComment()) {
      return this.next();
    } else if (
      this.isRadixInteger() ||
      this.isNumber() ||
      this.isOperator() ||
      this.isString() ||
      this.isParen() ||
      this.isComma() ||
      this.isNamedOp() ||
      this.isConst() ||
      this.isName()
    ) {
      return this.current;
    } else {
      return this.parseError(
        'Unknown character "' + this.expression.charAt(this.pos) + '"',
      );
    }
  }

  public isString() {
    let r = false;
    let startPos = this.pos;
    let quote = this.expression.charAt(startPos);

    if (quote === '"') {
      let index = this.expression.indexOf(quote, startPos + 1);
      while (index >= 0 && this.pos < this.expression.length) {
        this.pos = index + 1;
        if (this.expression.charAt(index - 1) !== '\\') {
          let rawString = this.expression.substring(startPos + 1, index);
          this.current = this.newToken(
            TokenTypes.TSTRING,
            this.unescape(rawString),
            startPos,
          );
          r = true;
          break;
        }
        index = this.expression.indexOf(quote, index + 1);
      }
    }
    return r;
  }

  public isParen() {
    let c = this.expression.charAt(this.pos);
    if (c === '(' || c === ')') {
      this.current = this.newToken(TokenTypes.TPAREN, c);
      this.pos++;
      return true;
    }
    return false;
  }

  public isComma() {
    let c = this.expression.charAt(this.pos);
    if (c === ',') {
      this.current = this.newToken(TokenTypes.TCOMMA, ',');
      this.pos++;
      return true;
    }
    return false;
  }

  public isConst() {
    let startPos = this.pos;
    let i = startPos;
    for (; i < this.expression.length; i++) {
      let c = this.expression.charAt(i);
      if (c.toUpperCase() === c.toLowerCase()) {
        if (
          i === this.pos ||
          (c !== '_' && c !== '.' && (c < '0' || c > '9'))
        ) {
          break;
        }
      }
    }
    if (i > startPos) {
      let str = this.expression.substring(startPos, i);
      if (str in this.consts) {
        this.current = this.newToken(TokenTypes.TNUMBER, this.consts[str]);
        this.pos += str.length;
        return true;
      }
    }
    return false;
  }

  public isNamedOp() {
    let startPos = this.pos;
    let i = startPos;
    for (; i < this.expression.length; i++) {
      let c = this.expression.charAt(i);
      if (c.toUpperCase() === c.toLowerCase()) {
        if (i === this.pos || (c !== '_' && (c < '0' || c > '9'))) {
          break;
        }
      }
    }
    if (i > startPos) {
      let str = this.expression.substring(startPos, i);
      if (
        this.isOperatorEnabled(str) &&
        (str in this.binaryOps ||
          str in this.unaryOps ||
          str in this.ternaryOps)
      ) {
        this.current = this.newToken(TokenTypes.TOP, str);
        this.pos += str.length;
        return true;
      }
    }
    return false;
  }

  public isName() {
    let startPos = this.pos;
    let i = startPos;
    let hasLetter = false;
    for (; i < this.expression.length; i++) {
      let c = this.expression.charAt(i);
      if (c.toUpperCase() === c.toLowerCase()) {
        if (i === this.pos && (c === '$' || c === '_')) {
          if (c === '_') {
            hasLetter = true;
          }
          continue;
        } else if (
          i === this.pos ||
          !hasLetter ||
          (c !== '_' && (c < '0' || c > '9'))
        ) {
          break;
        }
      } else {
        hasLetter = true;
      }
    }
    if (hasLetter) {
      let str = this.expression.substring(startPos, i);
      this.current = this.newToken(TokenTypes.TNAME, str);
      this.pos += str.length;
      return true;
    }
    return false;
  }

  public isWhitespace() {
    let r = false;
    let c = this.expression.charAt(this.pos);
    while (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      r = true;
      this.pos++;
      if (this.pos >= this.expression.length) {
        break;
      }
      c = this.expression.charAt(this.pos);
    }
    return r;
  }

  public unescape(v: string) {
    let index = v.indexOf('\\');
    if (index < 0) {
      return v;
    }

    let buffer = v.substring(0, index);
    while (index >= 0) {
      let c = v.charAt(++index);
      switch (c) {
        case "'":
          buffer += "'";
          break;
        case '"':
          buffer += '"';
          break;
        case '\\':
          buffer += '\\';
          break;
        case '/':
          buffer += '/';
          break;
        case 'b':
          buffer += '\b';
          break;
        case 'f':
          buffer += '\f';
          break;
        case 'n':
          buffer += '\n';
          break;
        case 'r':
          buffer += '\r';
          break;
        case 't':
          buffer += '\t';
          break;
        case 'u':
          // interpret the following 4 characters as the hex of the unicode code point
          let codePoint = v.substring(index + 1, index + 5);
          if (!codePointPattern.test(codePoint)) {
            this.parseError('Illegal escape sequence: \\u' + codePoint);
          }
          buffer += String.fromCharCode(parseInt(codePoint, 16));
          index += 4;
          break;
        default:
          throw this.parseError('Illegal escape sequence: "\\' + c + '"');
      }
      ++index;
      let backslash = v.indexOf('\\', index);
      buffer += v.substring(index, backslash < 0 ? v.length : backslash);
      index = backslash;
    }

    return buffer;
  }

  public isComment() {
    let c = this.expression.charAt(this.pos);
    if (c === '/' && this.expression.charAt(this.pos + 1) === '*') {
      this.pos = this.expression.indexOf('*/', this.pos) + 2;
      if (this.pos === 1) {
        this.pos = this.expression.length;
      }
      return true;
    }
    return false;
  }

  public isRadixInteger() {
    let pos = this.pos;

    if (
      pos >= this.expression.length - 2 ||
      this.expression.charAt(pos) !== '0'
    ) {
      return false;
    }
    ++pos;

    let radix;
    let validDigit;
    if (this.expression.charAt(pos) === 'x') {
      radix = 16;
      validDigit = /^[0-9a-f]$/i;
      ++pos;
    } else if (this.expression.charAt(pos) === 'b') {
      radix = 2;
      validDigit = /^[01]$/i;
      ++pos;
    } else {
      return false;
    }

    let valid = false;
    let startPos = pos;

    while (pos < this.expression.length) {
      let c = this.expression.charAt(pos);
      if (validDigit.test(c)) {
        pos++;
        valid = true;
      } else {
        break;
      }
    }

    if (valid) {
      this.current = this.newToken(
        TokenTypes.TNUMBER,
        parseInt(this.expression.substring(startPos, pos), radix),
      );
      this.pos = pos;
    }
    return valid;
  }

  public isNumber() {
    let valid = false;
    let pos = this.pos;
    let startPos = pos;
    let resetPos = pos;
    let foundDot = false;
    let foundDigits = false;
    let c;

    while (pos < this.expression.length) {
      c = this.expression.charAt(pos);
      if ((c >= '0' && c <= '9') || (!foundDot && c === '.')) {
        if (c === '.') {
          foundDot = true;
        } else {
          foundDigits = true;
        }
        pos++;
        valid = foundDigits;
      } else {
        break;
      }
    }

    if (valid) {
      resetPos = pos;
    }

    if (c === 'e' || c === 'E') {
      pos++;
      let acceptSign = true;
      let validExponent = false;
      while (pos < this.expression.length) {
        c = this.expression.charAt(pos);
        if (acceptSign && (c === '+' || c === '-')) {
          acceptSign = false;
        } else if (c >= '0' && c <= '9') {
          validExponent = true;
          acceptSign = false;
        } else {
          break;
        }
        pos++;
      }

      if (!validExponent) {
        pos = resetPos;
      }
    }

    if (valid) {
      this.current = this.newToken(
        TokenTypes.TNUMBER,
        parseFloat(this.expression.substring(startPos, pos)),
      );
      this.pos = pos;
    } else {
      this.pos = resetPos;
    }
    return valid;
  }

  public isOperator() {
    let startPos = this.pos;
    let c = this.expression.charAt(this.pos);

    if (
      c === '+' ||
      c === '-' ||
      c === '/' ||
      c === '%' ||
      c === '^' ||
      c === '?' ||
      c === ':' ||
      c === '~' ||
      c === '.'
    ) {
      this.current = this.newToken(TokenTypes.TOP, c);
    } else if (c === '*') {
      if (this.expression.charAt(this.pos + 1) === '*') {
        this.current = this.newToken(TokenTypes.TOP, '**');
        this.pos++;
      } else {
        this.current = this.newToken(TokenTypes.TOP, '*');
      }
    } else if (c === '>') {
      if (this.expression.charAt(this.pos + 1) === '=') {
        this.current = this.newToken(TokenTypes.TOP, '>=');
        this.pos++;
      } else if (this.expression.charAt(this.pos + 1) === '>') {
        this.current = this.newToken(TokenTypes.TOP, '>>');
        this.pos++;
      } else {
        this.current = this.newToken(TokenTypes.TOP, '>');
      }
    } else if (c === '<') {
      if (this.expression.charAt(this.pos + 1) === '=') {
        this.current = this.newToken(TokenTypes.TOP, '<=');
        this.pos++;
      } else if (this.expression.charAt(this.pos + 1) === '<') {
        this.current = this.newToken(TokenTypes.TOP, '<<');
        this.pos++;
      } else {
        this.current = this.newToken(TokenTypes.TOP, '<');
      }
    } else if (c === '|') {
      if (this.expression.charAt(this.pos + 1) === '|') {
        this.current = this.newToken(TokenTypes.TOP, '||');
        this.pos++;
      } else {
        this.current = this.newToken(TokenTypes.TOP, '|');
      }
    } else if (c === '&') {
      if (this.expression.charAt(this.pos + 1) === '&') {
        this.current = this.newToken(TokenTypes.TOP, '&&');
        this.pos++;
      } else {
        this.current = this.newToken(TokenTypes.TOP, '&');
      }
    } else if (c === '=') {
      if (this.expression.charAt(this.pos + 1) === '=') {
        this.current = this.newToken(TokenTypes.TOP, '==');
        this.pos++;
      } else {
        return false;
      }
    } else if (c === '!') {
      if (this.expression.charAt(this.pos + 1) === '=') {
        this.current = this.newToken(TokenTypes.TOP, '!=');
        this.pos++;
      } else {
        this.current = this.newToken(TokenTypes.TOP, c);
      }
    } else if (c === 'e') {
      if (this.expression.charAt(this.pos + 1) === 'q') {
        this.current = this.newToken(TokenTypes.TOP, '==');
        this.pos++;
      } else {
        return false;
      }
    } else if (c === 'n') {
      if (this.expression.charAt(this.pos + 1) === 'e') {
        this.current = this.newToken(TokenTypes.TOP, '!=');
        this.pos++;
      } else {
        return false;
      }
    } else {
      return false;
    }
    this.pos++;

    if (this.isOperatorEnabled(this.current.value)) {
      return true;
    } else {
      this.pos = startPos;
      return false;
    }
  }

  public isOperatorEnabled(op: string) {
    let optionName = getOptionName(op);
    let operators = this.options.operators || {};

    // in is a special case for now because it's disabled by default
    if (optionName === 'in') {
      return !!operators['in'];
    }

    return !(optionName in operators) || !!operators[optionName];
  }

  public getCoordinates(): { line: number; column: number } {
    let line = 0;
    let column;
    let newline = -1;
    do {
      line++;
      column = this.pos - newline;
      newline = this.expression.indexOf('\n', newline + 1);
    } while (newline >= 0 && newline < this.pos);

    return {
      line: line,
      column: column,
    };
  }

  public parseError(msg: string): never {
    let coords = this.getCoordinates();
    throw new Error(
      'parse error [' + coords.line + ':' + coords.column + ']: ' + msg,
    );
  }
}

function getOptionName(op: string): string {
  return optionNameMap.hasOwnProperty(op) ? optionNameMap[op] : op;
}
