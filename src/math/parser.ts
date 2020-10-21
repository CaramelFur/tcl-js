import { TokenTypes } from './token';
import { TokenStream } from './token-stream';
import { ParserState } from './parser-state';
import { Expression } from './expression';
import {
  bool,
  sinh,
  cosh,
  tanh,
  log10,
  neg,
  condition,
  fmod,
} from './functions';
import { Token } from './token';
import { Instruction } from './instruction';

export type Value = number
    | string
    | ((...args: Value[]) => Value)
    | { [propertyName: string]: Value };

export interface Values {
    [propertyName: string]: Value;
}

export interface ParserOptions {
  allowMemberAccess?: boolean;
  operators?: {
  };
}

type opsFunction = (...args: Array<any>) => boolean | string | number;
export type opsHolder = { [index: string]: opsFunction };

export class Parser {
  static sharedParser = new Parser();

  public options: { [index: string]: any };
  public consts: { [index: string]: string | boolean | number };
  public unaryOps: opsHolder;
  public binaryOps: opsHolder;
  public ternaryOps: opsHolder;
  public functions: opsHolder;

  public constructor(options?: { [index: string]: any }) {
    this.options = options || {};
    this.unaryOps = {
      '!': (a: boolean | number) => !a,
      '~': (a: number) => ~a,
      '+': Number,
      '-': neg,
    };

    this.binaryOps = {
      '+': (a, b) => a + b,
      '-': (a, b) => a - b,
      '*': (a, b) => a * b,
      '/': (a, b) => a / b,
      '%': (a, b) => a % b,
      '**': Math.pow,
      '||': (a, b) => a || b,
      '&&': (a, b) => a && b,
      '==': (a, b) => a == b,
      '!=': (a, b) => a != b,
      '>': (a, b) => a > b,
      '<': (a, b) => a < b,
      '>=': (a, b) => a >= b,
      '<=': (a, b) => a <= b,
      '<<': (a, b) => a << b,
      '>>': (a, b) => a >> b,
      '&': (a, b) => a & b,
      '^': (a, b) => a ^ b,
      '|': (a, b) => a | b,
    };

    this.ternaryOps = {
      '?': condition,
    };

    this.functions = {
      abs: Math.abs,
      acos: Math.acos,
      asin: Math.asin,
      atan: Math.atan,
      atan2: Math.atan2,
      bool: bool,
      ceil: Math.ceil,
      cos: Math.cos,
      cosh: Math.cosh || cosh,
      double: (a) => a,
      entier: (a) => a,
      exp: Math.exp,
      floor: Math.floor,
      fmod: fmod,
      hypot: Math.hypot,
      int: (a) => Math.round(a),
      isqrt: (a) => Math.floor(Math.sqrt(a)),
      log10: Math.log10 || log10,
      log: Math.log,
      max: Math.max,
      min: Math.min,
      pow: Math.pow,
      rand: () => Math.random(),
      round: Math.round,
      sin: Math.sin,
      sinh: Math.sinh || sinh,
      sqrt: Math.sqrt,
      srand: (a) => Math.random(),
      tan: Math.tan,
      tanh: Math.tanh || tanh,
      wide: (a) => a,
    };

    this.consts = {
      E: Math.E,
      PI: Math.PI,
      true: true,
      yes: true,
      on: true,
      false: false,
      no: false,
      off: false,
    };
  }

  public parse(expr: string) {
    let instr: Instruction[] = [];
    let tokenStream = new TokenStream(this, expr);

    let parserState = new ParserState(this, tokenStream, {
      allowMemberAccess: this.options.allowMemberAccess,
    });

    parserState.parseExpression(instr);

    console.log(instr);

    parserState.expect(TokenTypes.TEOF, 'EOF');

    return new Expression(instr, this);
  }

  public evaluate(expr: string, variables?: Value) {
    return this.parse(expr).evaluate(variables);
  }

  static parse(expr: string) {
    return this.sharedParser.parse(expr);
  }

  static evaluate(expr: string, variables?: Value) {
    return this.sharedParser.parse(expr).evaluate(variables);
  }
}
