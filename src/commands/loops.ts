import { TclSimple, TclVariable } from '../types';
import { Scope } from '../scope';
import * as Is from '../is';
import { Interpreter } from '../interpreter';
import { TclError } from '../tclerror';

/**
 * Function to load the procs into the scope
 *
 * @export
 * @param {Scope} scope
 */
export function Load(scope: Scope) {
  /**
   * while test body
   *
   * @see https://wiki.tcl-lang.org/page/while
   */
  scope.defineProc(
    'while',
    async (interpreter, args, command, helpers) => {
      args = <string[]>args;

      let output: TclVariable = new TclSimple('');

      let expression = args[0];
      let code = args[1];

      // Create a new scope
      let newScope = new Scope(interpreter.getScope());

      // Set the loop variable
      newScope.setSetting('loop', true);

      // Interpret the procedures tcl code with the new scope
      let newInterpreter = new Interpreter(interpreter.getTcl(), code, newScope);

      while (Is.True((await helpers.solveExpression(expression)).toString())) {
        // If so run the code and return the result
        newInterpreter.reset();

        // Return the result
        output = await newInterpreter.run();

        // Check if we should break
        let checkLoop = newScope.getSetting('loop');
        if (checkLoop && typeof checkLoop !== 'boolean' && checkLoop.break)
          break;
        
        // Reset the scope loop settings
        newScope.setSetting('loop', true);
      }

      return output;
    },
    {
      arguments: {
        pattern: `while test body`,
        textOnly: true,
        amount: 2,
      },
    },
  );

  /**
   * break
   *
   * @see https://wiki.tcl-lang.org/page/break
   */
  scope.defineProc(
    'break',
    async (interpreter, args, command, helpers) => {
      if (!interpreter.getScope().getSetting('loop'))
        throw new TclError('executed break outside of loop');
      interpreter.getScope().setSubSetting('loop', 'break', true);

      return new TclSimple('');
    },
    {
      arguments: {
        pattern: `break`,
        amount: 0,
      },
    },
  );

  /**
   * continue
   *
   * @see https://wiki.tcl-lang.org/page/while
   */
  scope.defineProc(
    'continue',
    async (interpreter, args, command, helpers) => {
      if (!interpreter.getScope().getSetting('loop'))
        throw new TclError('executed continue outside of loop');
      interpreter.getScope().setSubSetting('loop', 'continue', true);

      return new TclSimple('');
    },
    {
      arguments: {
        pattern: `continue`,
        amount: 0,
      },
    },
  );
}
