import { Interpreter } from '../interpreter';
import * as math from 'mathjs';
import { TclVariable, TclProcFunction } from '../types';
import { Scope } from '../scope';
import { TclError } from '../tclerror';

let commands: { [index: string]: TclProcFunction } = {};

/**
 * set - reads and writes variables
 *
 * :: varName ?value?
 *
 * @see https://wiki.tcl-lang.org/page/set
 */

commands.set = (
  interpreter: Interpreter,
  args: Array<string>,
  varArgs: Array<TclVariable>,
): any => {
  const [varName, value] = args;

  if (args.length === 2) {
    interpreter.scope.define(varName, value);
    return value;
  } else if (args.length === 1) {
    return interpreter.scope.resolve(varName);
  }

  throw new TclError('wrong # args: should be "set varName ?newValue?"');
};

/**
 * unset — Delete variables
 *
 * :: ?-nocomplain? varName ?varName ...?
 *
 * @see https://wiki.tcl-lang.org/page/unset
 */

commands.unset = (
  interpreter: Interpreter,
  args: Array<string>,
  varArgs: Array<TclVariable>,
): any => {
  let nocomplain = false;
  if (args[0] === '-nocomplain') {
    nocomplain = true;
    args.shift();
  }

  if (args.length === 0)
    throw new TclError(
      'wrong # args: should be "unset ?-nocomplain? varName ?varName ...?"',
    );

  for (let arg of args) {
    interpreter.scope.undefine(arg);
  }

  return '';
};

/**
 * expr — Evaluates an expression
 *
 * :: arg ?arg arg ...?
 *
 * @see https://wiki.tcl-lang.org/page/expr
 */

commands.expr = (
  interpreter: Interpreter,
  args: Array<string>,
  varArgs: Array<TclVariable>,
): any => {
  if (args.length === 0)
    throw new TclError('wrong # args: should be "unset arg ?arg arg ...?"');

  let expression = args.join(' ');

  try {
    return math.eval(expression);
  } catch (e) {
    throw new TclError('invalid expression');
  }
};

/**
 * info — provides information about the state of a Tcl interpreter
 *
 * :: option ?arg arg ...?
 *
 * @see https://wiki.tcl-lang.org/page/info
 */

commands.info = (
  interpreter: Interpreter,
  args: Array<string>,
  varArgs: Array<TclVariable>,
): any => {
  if (args.length === 0)
    throw new TclError('wrong # args: should be "info option ?arg arg ...?"');

  let type = args.shift();

  switch (type) {
    case 'commands':
      return 'commands';
  }

  return '';
};

/**
 * Function to load the procs into the scope
 *
 * @param  {Scope} scope
 */
export function Load(scope: Scope) {
  for (let command in commands) {
    scope.defineProc(command, commands[command]);
  }
}
