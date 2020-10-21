import { Interpreter } from '../interpreter';
import { TclVariable, TclSimple, TclProcFunction, TclList } from '../types';
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
      let tclCode = args[2].getValue();

      // Create an empty holder for all command options
      let commandArgsMap: Array<{
        name: string;
        default?: TclVariable;
      }> = [];

      // Convert the arguments list to an actual list
      let commandArgsList = commandArgsString.getList();

      // Loop over every argument in the list
      for (let i = 0; i < commandArgsList.getLength(); i++) {
        let commandArgList = commandArgsList.getSubValue(i).getList();

        // Check if every argument in the list has the correct length
        if (commandArgList.getLength() > 2)
          throw new TclError(
            'too many fields in argument specifier: ' +
              commandArgList.getValue(),
          );
        if (commandArgList.getLength() < 1)
          throw new TclError('argument with no name');

        // Convert the arguments in their corresponding parts
        let commandArgName = commandArgList.getSubValue(0).getValue();
        let commandArgDefault: TclVariable | undefined = undefined;
        if (commandArgList.getLength() === 2)
          commandArgDefault = commandArgList.getSubValue(1);

        // Insert the argument into the argument map
        commandArgsMap[i] = {
          name: commandArgName,
        };
        
        // Assign the default value if necessary
        if (commandArgDefault !== undefined)
          commandArgsMap[i].default = commandArgDefault;
      }

      console.log(commandArgsMap);

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

        // Open a new scope for the code to be ran in, this scope has no parent but the same disabled commands
        let newScope = new Scope(
          undefined,
          interpreter.getTcl().getDisabledCommands(),
        );

        let useArgsVar = false;

        if (commandArgsMap[commandArgsMap.length - 1].name === 'args') {
          useArgsVar = true;
          commandArgsMap.length -= 1;
        }

        // Put all the given arguments in the created scope
        for (let i = 0; i < commandArgsMap.length; i++) {
          let commandArg = commandArgsMap[i];
          let parsedArg = parsedArgs.shift();

          let argName: string = commandArg.name;
          let argValue: TclVariable;

          if (parsedArg) {
            argValue = parsedArg;
          } else {
            if (!commandArg.default)
              throw new TclError(
                `wrong # args: should be "${commandArgsString.getValue()}"`,
              );
            argValue = commandArg.default;
          }

          newScope.define(argName, argValue);
        }

        if (parsedArgs.length > 0) {
          if (!useArgsVar)
            throw new TclError(
              `wrong # args: should be "${commandArgsString.getValue()}"`,
            );

          let outString = new TclList(parsedArgs).getValue();
          let outVar = new TclSimple(outString, 'args');

          newScope.define('args', outVar);
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
