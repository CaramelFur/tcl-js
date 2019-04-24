import { Interpreter } from '../interpreter';
import {
  TclVariable,
  TclSimple,
  TclProcFunction,
  TclProcHelpers,
} from '../types';
import { Scope } from '../scope';
import { TclError } from '../tclerror';
import { CommandToken } from '../parser';

/**
 * Function to load the procs into the scope
 *
 * @param  {Scope} scope
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
    (
      interpreter: Interpreter,
      args: Array<TclVariable>,
      commandToken: CommandToken,
      helpers: TclProcHelpers,
    ): TclVariable => {
      // Check if there are enough arguments
      if (args.length !== 3) return helpers.sendHelp('wargs');

      // Check if arguments are correct
      for (let arg of args) {
        if (!(arg instanceof TclSimple)) return helpers.sendHelp('wtype');
      }

      // Load the procedure arguments
      let commandArgsString = <TclSimple>args[1];

      // Map all arguments to a corresponding variable
      let command = args[0].getValue();
      let commandArgs = commandArgsString.getList();
      let tclCode = args[2].getValue();

      // Create a function to be executed on this procedure call
      let commandFunction: TclProcFunction = (
        parsedInterpreter: Interpreter,
        parsedArgs: Array<TclVariable>,
      ) => {
        // Check if the arguments length is correct
        if (parsedArgs.length !== commandArgs.getLength())
          throw new TclError(`wrong # args on procedure "${command}"`);

        // Open a new scope for the code to be ran in, this scope has no parent but the same disabled commands
        let newScope = new Scope(undefined, interpreter.tcl.disabledCommands);

        // Put all the given arguments in the created scope
        for (let i = 0; i < parsedArgs.length; i++) {
          let argName = commandArgs.getSubValue(i).getValue();
          let argValue = parsedArgs[i];

          newScope.define(argName, argValue);
        }

        // Interpret the procedures tcl code with the new scope
        let newInterpreter = new Interpreter(
          parsedInterpreter.tcl,
          tclCode,
          newScope,
        );

        // Return the result
        return newInterpreter.run();
      };

      // Add the function to the scoped procedure list
      interpreter.scope.defineProc(command, commandFunction);

      return new TclSimple('');
    },
    {
      pattern: 'proc name arguments body',
      helpMessages: {
        wargs: `wrong # args`,
        wtype: `wrong type`,
      },
    },
  );
}
