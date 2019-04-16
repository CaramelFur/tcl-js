import { CommandHandler } from './';
import { Interpreter } from '../interpreter';

let commands: { [index: string]: Function } = {};

/**
 * set - reads and writes variables
 *
 * :: varName ?value?
 *
 * @see https://wiki.tcl-lang.org/page/set
 */

commands.set = (interpreter: Interpreter, args: Array<string>): any => {
  const [varName, value] = args;

  // TODO: handle arrays

  if (args.length === 2) {
    interpreter.scope.define(varName, value);
    return value;
  } else if (args.length === 1) {
    return interpreter.scope.resolve(varName);
  }

  throw new Error('wrong # args: should be "set varName ?newValue?"');
};

/**
 * unset — Delete variables
 *
 * :: ?-nocomplain? varName ?varName ...?
 *
 * @see https://wiki.tcl-lang.org/page/unset
 */

commands.unset = (interpreter: Interpreter, args: Array<string>): any => {
  let nocomplain = false;
  if (args[0] === '-nocomplain') {
    nocomplain = true;
    args.shift();
  }

  if (args.length === 0) throw new Error('wrong # args: should be "unset ?-nocomplain? varName ?varName ...?"');

  let returnValue: any = 0;
  for(let arg of args){
    returnValue = interpreter.scope.undefine(arg);
  }

  return returnValue;
};

export function Load(commandset: CommandHandler) {
  for (let command in commands) {
    commandset.define(command, commands[command]);
  }
}
