import { Interpreter } from '../interpreter';
import {
  TclVariable,
  TclSimple,
  TclProcFunction,
} from '../types';
import { Scope } from '../scope';
import { TclError } from '../tclerror';

/**
 * Function to load the procs into the scope
 *
 * @export
 * @param {Scope} scope
 */
export function Load(scope: Scope) {
  /**
   * proc - creates a new command
   *
   * :: name arguments body
   *
   * @see https://wiki.tcl-lang.org/page/proc
   */
  scope.defineProc(
    'proc',
    (interpreter, args, commandToken, helpers) => {
      args = <TclSimple[]>args;

      // Load the procedure arguments
      let commandArgsString = <TclSimple>args[1];

      // Map all arguments to a corresponding variable
      let command = args[0].getValue();
      let commandArgs = commandArgsString.getList();
      let tclCode = args[2].getValue();

      /**
       * The function to be executed on the procedure call
       *
       * @param {*} parsedInterpreter
       * @param {*} parsedArgs
       * @returns
       */
      let commandFunction: TclProcFunction = (
        parsedInterpreter,
        parsedArgs,
      ) => {
        parsedArgs = <TclVariable[]>parsedArgs;

        // Check if the arguments length is correct
        if (parsedArgs.length !== commandArgs.getLength())
          throw new TclError(`wrong # args on procedure "${command}"`);

        // Open a new scope for the code to be ran in, this scope has no parent but the same disabled commands
        let newScope = new Scope(undefined, interpreter.getTcl().getDisabledCommands());

        // Put all the given arguments in the created scope
        for (let i = 0; i < parsedArgs.length; i++) {
          let argName = commandArgs.getSubValue(i).getValue();
          let argValue = parsedArgs[i];

          newScope.define(argName, argValue);
        }

        // Interpret the procedures tcl code with the new scope
        let newInterpreter = new Interpreter(
          parsedInterpreter.getTcl(),
          tclCode,
          newScope,
        );

        // Return the result
        return newInterpreter.run();
      };

      // Add the function to the scoped procedure list
      interpreter.getScope().defineProc(command, commandFunction);

      return new TclSimple('');
    },
    {
      arguments: {
        amount: 3,
        pattern: 'proc name arguments body',
        simpleOnly: true,
      },
    },
  );
}
