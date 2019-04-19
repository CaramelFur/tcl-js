import { Interpreter } from '../interpreter';
import { TclVariable, TclSimple, TclProcFunction } from '../types';
import { Scope } from '../scope';
import { TclError } from '../tclerror';

let commands: { [index: string]: TclProcFunction } = {};

/**
 * proc - creates a new command
 *
 * :: name arguments body
 *
 * @see https://wiki.tcl-lang.org/page/proc
 */

commands.proc = (
  interpreter: Interpreter,
  args: Array<string>,
  varArgs: Array<TclVariable>,
): string => {
  // Check if there are enough arguments
  if (varArgs.length !== 3)
    throw new TclError('wrong # args: should be "proc name arguments body"');

  // Load the procedure arguments
  let commandArgsString = varArgs[1];

  // Check if these are of the correct type
  if (!(commandArgsString instanceof TclSimple))
    throw new TclError('invalid arguments argument');

  // Map all arguments to a corresponding variable
  let command = args[0];
  let commandArgs = commandArgsString.getList();
  let tclCode = args[2];

  // Create a function to be executed on this procedure call
  let commandFunction = (
    parsedInterpreter: Interpreter,
    parsedArgs: Array<string>,
    parsedVarArgs: Array<TclVariable>,
  ) => {
    // Check if the arguments length is correct
    if (parsedVarArgs.length !== commandArgs.getLength())
      throw new TclError(`wrong # args on function "${command}"`);

    // Open a new scope for the code to be ran in, this scope has no parent but the same disabled commands
    let newScope = new Scope(undefined, interpreter.tcl.disabledCommands);

    // Put all the given arguments in the created scope
    for (let i = 0; i < parsedVarArgs.length; i++) {
      let argName = commandArgs.getSubValue(i).getValue();
      let argValue = parsedVarArgs[i].getValue();
      newScope.define(argName, argValue);
    }

    // Interpret the procedures tcl code with the new scope
    let newInterpreter = new Interpreter(parsedInterpreter.tcl, tclCode, newScope);

    // Return the result
    return newInterpreter.run();
  };

  // Add the function to the scoped procedure list
  interpreter.scope.defineProc(command, commandFunction);

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
