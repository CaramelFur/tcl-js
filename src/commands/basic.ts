import { Interpreter } from '../interpreter';
import * as math from 'mathjs';
import { TclVariable, TclProcFunction } from '../types';
import { Scope } from '../scope';
import { TclError } from '../tclerror';
import { resolve } from 'dns';
import { CommandToken } from '../parser';

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
  command: CommandToken,
): string => {
  const [varName, value] = args;

  // If there are 2 arguments, set the variable
  if (args.length === 2) {
    interpreter.scope.define(varName, value);
    return value;
  }
  // If there is 1 argument return the variable
  else if (args.length === 1) {
    return interpreter.scope.resolve(varName).getValue();
  }

  // If there are any other amount of variables throw an error
  throw new TclError(
    `wrong # args: should be "set varName ?newValue?"\nwhile reading: "${
      command.codeLine
    }"`,
  );
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
): string => {
  // Set the nocomplain variable
  let nocomplain = false;
  if (args[0] === '-nocomplain') {
    nocomplain = true;
    args.shift();
  }

  // Check if there are enough arguments
  if (args.length === 0)
    throw new TclError(
      'wrong # args: should be "unset ?-nocomplain? varName ?varName ...?"',
    );

  // Loop over every argument and unset it
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
): string => {
  // Check if there are enough arguments
  if (args.length === 0)
    throw new TclError('wrong # args: should be "unset arg ?arg arg ...?"');

  // Create a full expression by joining all arguments
  let expression = args.join(' ');

  // Try to solve the expression and return the result
  let result = math.eval(expression);

  //Check if the result is usable
  if (typeof result !== 'number')
    throw new TclError('expression result is not a number');
  if (result === Infinity) throw new TclError('expression result is Infinity');

  return `${result}`;
};

/**
 * eval — Evaluates tcl code
 *
 * :: arg ?arg arg ...?
 *
 * @see https://wiki.tcl-lang.org/page/eval
 */

commands.eval = async (
  interpreter: Interpreter,
  args: Array<string>,
  varArgs: Array<TclVariable>,
): Promise<string> => {
  // Check if there are enough arguments
  if (args.length === 0)
    throw new TclError('wrong # args: should be "eval arg ?arg arg ...?"');

  // Create a full string by joining all arguments
  let code = args.join(' ');

  // Interpret the tcl code with a subscope
  let newInterpreter = new Interpreter(
    interpreter.tcl,
    code,
    new Scope(interpreter.scope),
  );

  // Return the result
  return newInterpreter.run();
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
): string => {
  // Check if there are enough arguments
  if (args.length === 0)
    throw new TclError('wrong # args: should be "info option ?arg arg ...?"');

  let type = args.shift();

  // Execute the correct thing
  switch (type) {
    case 'commands':
      return 'commands';
  }

  return '';
};

commands.wait = async (
  interpreter: Interpreter,
  args: Array<string>,
  varArgs: Array<TclVariable>,
): Promise<string> => {
  const timeout = (ms: number) => new Promise((res) => setTimeout(res, ms));

  await timeout(2000);
  return 'wow';
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
