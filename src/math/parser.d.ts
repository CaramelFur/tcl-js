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

export class Parser {
    constructor(options?: ParserOptions);
    functions: any;
    parse(expression: string): Expression;
    evaluate(expression: string, values?: Value): number;
    static parse(expression: string): Expression;
    static evaluate(expression: string, values?: Value): number;
}

export interface Expression {
    simplify(values?: Value): Expression;
    evaluate(values?: Value): any;
    substitute(variable: string, value: Expression | string | number): Expression;
    symbols(options?: { withMembers?: boolean }): string[];
    variables(options?: { withMembers?: boolean }): string[];
    toJSFunction(params: string, values?: Value): (...args: any[]) => number;
}
