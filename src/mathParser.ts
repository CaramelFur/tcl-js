import { Parser as EParser } from 'expr-eval';

export class Parser extends EParser {
  constructor() {
    super({
      operators: {
        add: true,
        concatenate: true,
        conditional: true,
        divide: true,
        factorial: false,
        multiply: true,
        power: true,
        remainder: true,
        subtract: true,

        logical: true,
        comparison: true,

        in: true,
      },
    });

    // Remap some pre-existing functions
    rename(this.functions, 'random', 'rand');
    delete this.functions.roundTo;
    delete this.functions.factorial;
    delete this.functions.fac;
    delete this.functions.pyt;
    delete this.functions.if;
    delete this.functions.gamma;

    this.functions = { ...this.functions, ...funcs };
  }
}

// Container for all math functions
const funcs: { [index: string]: Function } = {};

funcs.land = (...args: any[]): boolean => {
  return args.every((arg) => arg == true);
};

funcs.lor = (...args: any[]): boolean => {
  return args.find((arg) => arg == true) !== undefined;
};

funcs.lshift = (inp: number, amount: number): number => {
  return inp << amount;
};

funcs.rshift = (inp: number, amount: number): number => {
  return inp >> amount;
};

funcs.band = (a: number, b: number): number => {
  return a & b;
};

funcs.bor = (a: number, b: number): number => {
  return a | b;
};

funcs.bnot = (a: number): number => {
  return ~a;
};

funcs.bxor = (a: number, b: number): number => {
  return a ^ b;
};

funcs.fmod = (a: number, b: number): number => {
  return a % b;
};

funcs.bool = (a: number): boolean => {
  return a ? true : false;
};

funcs.double = (a: number): number => {
  return a;
};

funcs.entier = (a: number): number => {
  return a;
};

funcs.wide = (a: number): number => {
  return a;
};

funcs.int = (a: number): number => {
  return parseInt(`${a}`, 10);
};

funcs.isqrt = (a: number): number => {
  let out = Math.sqrt(a);
  return parseInt(`${out}`, 10);
};

funcs.srand = (a: number): number => {
  return Math.random();
};

/**
 * Function to rename an item in an object
 *
 * @param  {{[index:string]:any}} object - The object to rename in
 * @param  {string} from - The name of the item
 * @param  {string} to - The name you want to give the item
 */
function rename(object: { [index: string]: any }, from: string, to: string) {
  let buf = object[from];
  delete object[from];
  object[to] = buf;
}
