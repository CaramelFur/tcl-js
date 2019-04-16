import { CommandHandler } from './';
import { Interpreter } from '../interpreter';

let commands: { [index: string]: Function } = {};

/**
 * set - reads and writes variables
 *
 * :: varName ?value?
 *
 * @see https://wiki.tcl.tk/1024
 */

commands.set = (interpreter: Interpreter, args: Array<string>): any => {
  const [varName, value] = args;

  // TODO: handle arrays

  if (args.length === 2) {
    interpreter.scope.define(varName, value);
    return value;
  } else if (args.length === 1) {
    const symbol = interpreter.scope.resolve(varName);
    return symbol.value;
  }

  throw new Error('wrong # args: should be "set varName ?newValue?"');
};

export function Load(commandset: CommandHandler) {
  for (let command in commands) {
    commandset.define(command, commands[command]);
  }
}
