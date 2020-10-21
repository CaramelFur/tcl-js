import simplify from './simplify';
import substitute from './substitute';
import evaluate from './evaluate';
import expressionToString from './expression-to-string';
import getSymbols from './get-symbols';
import { Parser, opsHolder } from './parser';
import { Value } from '../math_old/parser';
import { Instruction } from './instruction';

export class Expression {
  private tokens: Instruction[];
  private parser: Parser;
  
  public unaryOps: opsHolder;
  public binaryOps: opsHolder;
  public ternaryOps: opsHolder;
  public functions: opsHolder;

  public constructor(tokens: Instruction[], parser: Parser) {
    this.tokens = tokens;
    this.parser = parser;
    this.unaryOps = parser.unaryOps;
    this.binaryOps = parser.binaryOps;
    this.ternaryOps = parser.ternaryOps;
    this.functions = parser.functions;
  }

  public simplify(values?: Value): Expression {
    values = values || {};
    return new Expression(
      simplify(
        this.tokens,
        this.unaryOps,
        this.binaryOps,
        this.ternaryOps,
        values,
      ),
      this.parser,
    );
  }

  public substitute(
    variable: string,
    expr: Expression | string | number,
  ): Expression {
    if (!(expr instanceof Expression)) {
      expr = this.parser.parse(String(expr));
    }

    return new Expression(substitute(this.tokens, variable, expr), this.parser);
  }

  public evaluate(values?: Value): any {
    values = values || {};
    return evaluate(this.tokens, this, values);
  }

  public toString(): string {
    return expressionToString(this.tokens, false);
  }

  public symbols(options?: { withMembers?: boolean }): string[] {
    options = options || {};
    let vars: string[] = [];
    getSymbols(this.tokens, vars, options);
    return vars;
  }

  public variables(options?: { withMembers?: boolean }): string[] {
    options = options || {};
    let vars: string[] = [];
    getSymbols(this.tokens, vars, options);
    let functions = this.functions;
    return vars.filter(function(name) {
      return !(name in functions);
    });
  }

  public toJSFunction(
    param: string,
    variables?: Value,
  ): (...args: any[]) => number {
    let expr = this;
    let f = new Function(
      param,
      'with(this.functions) with (this.ternaryOps) with (this.binaryOps) with (this.unaryOps) { return ' +
        expressionToString(this.simplify(variables).tokens, true) +
        '; }',
    ); // eslint-disable-line no-new-func
    return function() {
      return f.apply(expr, arguments);
    };
  }
}
