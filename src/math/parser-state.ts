import { Token, TokenTypes } from './token';
import { Instruction, InstructionTypes, ternaryInstruction, binaryInstruction, unaryInstruction } from './instruction';
import contains from './contains';
import { Parser } from './parser';
import { TokenStream } from './token-stream';

let BITWISE_OPERATORS = ['&', '|', '^'];
let COMPARISON_OPERATORS = ['==', '!=', '<', '<=', '>=', '>', 'eq', 'ne'];
let SHIFT_OPERATORS = ['<<', '>>'];
let ADD_SUB_OPERATORS = ['+', '-'];
let TERM_OPERATORS = ['*', '/', '%'];

export class ParserState {
  parser: Parser;
  tokens: TokenStream;
  current: Token | null = null;
  nextToken: Token | null = null;
  savedCurrent: Token | null;
  savedNextToken: Token | null;
  allowMemberAccess: boolean;

  public constructor(parser: Parser, tokenStream: TokenStream, options: any) {
    this.parser = parser;
    this.tokens = tokenStream;
    this.next();
    this.savedCurrent = null;
    this.savedNextToken = null;
    this.allowMemberAccess = options.allowMemberAccess !== false;
  }

  public next() {
    this.current = this.nextToken;
    this.nextToken = this.tokens.next();
    return this.nextToken;
  }

  public tokenMatches(token: Token, value?: string | Function | any[]) {
    if (typeof value === 'undefined') {
      return true;
    } else if (Array.isArray(value)) {
      return contains(value, token.value);
    } else if (typeof value === 'function') {
      return value(token);
    } else {
      return token.value === value;
    }
  }

  save() {
    this.savedCurrent = this.current;
    this.savedNextToken = this.nextToken;
    this.tokens.save();
  }

  restore() {
    this.tokens.restore();
    this.current = this.savedCurrent;
    this.nextToken = this.savedNextToken;
  }

  accept(type: TokenTypes, value?: string | Function | any[]) {
    if (
      this.nextToken &&
      this.nextToken.type === type &&
      this.tokenMatches(this.nextToken, value)
    ) {
      this.next();
      return true;
    }
    return false;
  }

  expect(type: TokenTypes, value?: string | Function | any[]) {
    if (!this.accept(type, value)) {
      let coords = this.tokens.getCoordinates();
      throw new Error(
        'parse error [' +
          coords.line +
          ':' +
          coords.column +
          ']: Expected ' +
          (value || type),
      );
    }
  }

  parseAtom(instr: Instruction[]) {
    if(!this.current) throw new Error('Missing token in math parser')
    if (this.accept(TokenTypes.TNAME)) {
      instr.push(new Instruction(InstructionTypes.IVAR, this.current.value));
    } else if (this.accept(TokenTypes.TNUMBER)) {
      instr.push(new Instruction(InstructionTypes.INUMBER, this.current.value));
    } else if (this.accept(TokenTypes.TSTRING)) {
      instr.push(new Instruction(InstructionTypes.INUMBER, this.current.value));
    } else if (this.accept(TokenTypes.TPAREN, '(')) {
      this.parseExpression(instr);
      this.expect(TokenTypes.TPAREN, ')');
    } else {
      throw new Error('unexpected ' + this.nextToken);
    }
  }

  parseExpression(instr: Instruction[]) {
    this.parseConditionalExpression(instr);
  }

  parseConditionalExpression(instr: Instruction[]) {
    this.parseOrExpression(instr);
    while (this.accept(TokenTypes.TOP, '?')) {
      let trueBranch: Instruction[] = [];
      let falseBranch: Instruction[] = [];
      this.parseConditionalExpression(trueBranch);
      this.expect(TokenTypes.TOP, ':');
      this.parseConditionalExpression(falseBranch);
      instr.push(new Instruction(InstructionTypes.IEXPR, trueBranch));
      instr.push(new Instruction(InstructionTypes.IEXPR, falseBranch));
      instr.push(ternaryInstruction('?'));
    }
  }

  parseOrExpression(instr: Instruction[]) {
    this.parseAndExpression(instr);
    while (this.accept(TokenTypes.TOP, '||')) {
      let falseBranch: Instruction[] = [];
      this.parseAndExpression(falseBranch);
      instr.push(new Instruction(InstructionTypes.IEXPR, falseBranch));
      instr.push(binaryInstruction('||'));
    }
  }

  parseAndExpression(instr: Instruction[]) {
    this.parseBitwise(instr);
    while (this.accept(TokenTypes.TOP, '&&')) {
      let trueBranch: Instruction[] = [];
      this.parseBitwise(trueBranch);
      instr.push(new Instruction(InstructionTypes.IEXPR, trueBranch));
      instr.push(binaryInstruction('&&'));
    }
  }

  parseBitwise(instr: Instruction[]) {
    this.parseComparison(instr);
    while (this.accept(TokenTypes.TOP, BITWISE_OPERATORS)) {
      if(!this.current) throw new Error('Missing token in math parser')
      let op = this.current;
      this.parseComparison(instr);
      instr.push(binaryInstruction(op.value));
    }
  }

  parseComparison(instr: Instruction[]) {
    this.parseShift(instr);
    while (this.accept(TokenTypes.TOP, COMPARISON_OPERATORS)) {
      if(!this.current) throw new Error('Missing token in math parser')
      let op = this.current;
      this.parseShift(instr);
      instr.push(binaryInstruction(op.value));
    }
  }

  parseShift(instr: Instruction[]) {
    this.parseAddSub(instr);
    while (this.accept(TokenTypes.TOP, SHIFT_OPERATORS)) {
      if(!this.current) throw new Error('Missing token in math parser')
      let op = this.current;
      this.parseAddSub(instr);
      instr.push(binaryInstruction(op.value));
    }
  }

  parseAddSub(instr: Instruction[]) {
    this.parseTerm(instr);
    while (this.accept(TokenTypes.TOP, ADD_SUB_OPERATORS)) {
      if(!this.current) throw new Error('Missing token in math parser')
      let op = this.current;
      this.parseTerm(instr);
      instr.push(binaryInstruction(op.value));
    }
  }

  parseTerm(instr: Instruction[]) {
    this.parseExponential(instr);
    while (this.accept(TokenTypes.TOP, TERM_OPERATORS)) {
      if(!this.current) throw new Error('Missing token in math parser')
      let op = this.current;
      this.parseExponential(instr);
      instr.push(binaryInstruction(op.value));
    }
  }

  parseExponential(instr: Instruction[]) {
    this.parseFactor(instr);
    while (this.accept(TokenTypes.TOP, '**')) {
      this.parseFactor(instr);
      instr.push(binaryInstruction('**'));
    }
  }

  parseFactor(instr: Instruction[]) {
    let unaryOps = this.tokens.unaryOps;
    function isPrefixOperator(token: Token) {
      return token.value in unaryOps;
    }

    this.save();
    if (this.accept(TokenTypes.TOP, isPrefixOperator)) {
      if(!this.current || !this.nextToken) throw new Error('Missing token in math parser')
      if (
        this.current.value !== '-' &&
        this.current.value !== '+' &&
        this.nextToken.type === TokenTypes.TPAREN &&
        this.nextToken.value === '('
      ) {
        this.restore();
        this.parseFunctionCall(instr);
      } else {
        let op = this.current;
        this.parseFactor(instr);
        instr.push(unaryInstruction(op.value));
      }
    } else {
      this.parseFunctionCall(instr);
    }
  }

  parseFunctionCall(instr: Instruction[]) {
    let unaryOps = this.tokens.unaryOps;
    function isPrefixOperator(token: Token) {
      return token.value in unaryOps;
    }

    if (this.accept(TokenTypes.TOP, isPrefixOperator)) {
      if(!this.current) throw new Error('Missing token in math parser')
      let op = this.current;
      this.parseAtom(instr);
      instr.push(unaryInstruction(op.value));
    } else {
      this.parseMemberExpression(instr);
      while (this.accept(TokenTypes.TPAREN, '(')) {
        if (this.accept(TokenTypes.TPAREN, ')')) {
          instr.push(new Instruction(InstructionTypes.IFUNCALL, 0));
        } else {
          let argCount = this.parseArgumentList(instr);
          instr.push(new Instruction(InstructionTypes.IFUNCALL, argCount));
        }
      }
    }
  }

  parseArgumentList(instr: Instruction[]) {
    let argCount = 0;

    while (!this.accept(TokenTypes.TPAREN, ')')) {
      this.parseExpression(instr);
      ++argCount;
      while (this.accept(TokenTypes.TCOMMA)) {
        this.parseExpression(instr);
        ++argCount;
      }
    }

    return argCount;
  }

  parseMemberExpression(instr: Instruction[]) {
    this.parseAtom(instr);
    while (this.accept(TokenTypes.TOP, '.')) {
      if(!this.current) throw new Error('Missing token in math parser')
      if (!this.allowMemberAccess) {
        throw new Error('unexpected ".", member access is not permitted');
      }

      this.expect(TokenTypes.TNAME);
      instr.push(new Instruction(InstructionTypes.IMEMBER, this.current.value));
    }
  }
}
