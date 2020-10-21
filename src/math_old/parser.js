import { TEOF } from './token';
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

export function Parser(options) {
  this.options = options || {};
  this.unaryOps = {
    '!': (a) => !a,
    '~': (a) => ~a,
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
    off: false
  };
}

Parser.prototype.parse = function(expr) {
  var instr = [];
  var tokenStream = new TokenStream(this, expr);

  var parserState = new ParserState(this, tokenStream, {
    allowMemberAccess: this.options.allowMemberAccess,
  });

  parserState.parseExpression(instr);

  console.log(instr)

  parserState.expect(TEOF, 'EOF');

  return new Expression(instr, this);
};

Parser.prototype.evaluate = function(expr, variables) {
  return this.parse(expr).evaluate(variables);
};

var sharedParser = new Parser();

Parser.parse = function(expr) {
  return sharedParser.parse(expr);
};

Parser.evaluate = function(expr, variables) {
  return sharedParser.parse(expr).evaluate(variables);
};
