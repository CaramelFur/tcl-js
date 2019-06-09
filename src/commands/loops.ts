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

      let expression = args[0];
      let code = args[1];

      // Create a new scope
      let newScope = new Scope(interpreter.getScope());

      // Set the loop variable
      newScope.setSetting('loop', true);

      // Interpret the procedures tcl code with the new scope
      let newInterpreter = new Interpreter(interpreter.getTcl(), code, newScope);

      while (await helpers.solveExpression(expression)) {
        // If so run the code and return the result
        newInterpreter.reset();

        // Run the code
        await newInterpreter.run();

        // Check if we should break
        let checkLoop = newScope.getSetting('loop');
        if (checkLoop && typeof checkLoop !== 'boolean' && checkLoop.break)
          break;
        
        // Reset the scope loop settings
        newScope.setSetting('loop', true);
      }

      return new TclSimple('');
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
   * for start test next body
   *
   * @see https://wiki.tcl-lang.org/page/for
   */
  scope.defineProc(
    'for',
    async (interpreter, args, command, helpers) => {
      args = <string[]>args;

      let [start, test, next, code] = args;

      // Create a new scope
      let newScope = new Scope(interpreter.getScope());

      // Run the 'start' argument
      let startInterpreter = new Interpreter(interpreter.getTcl(), start, newScope);
      await startInterpreter.run();

      // Set the loop variable
      newScope.setSetting('loop', true);

      // Interpret the procedures tcl code with the new scope
      let newInterpreter = new Interpreter(interpreter.getTcl(), code, newScope);
      let nextInterpreter = new Interpreter(interpreter.getTcl(), next, newScope);

      while (await helpers.solveExpression(test)) {
        // If so run the code and return the result
        newInterpreter.reset();

        // Run the code
        await newInterpreter.run();

        // Check if we should break
        let checkLoop = newScope.getSetting('loop');
        if (checkLoop && typeof checkLoop !== 'boolean' && checkLoop.break)
          break;
        
        // Reset the scope loop settings
        newScope.setSetting('loop', true);

        // Reset the interpreter for the 'next' argument
        nextInterpreter.reset();

        // Execute the 'next' argument
        await nextInterpreter.run();
      }

      return new TclSimple('');
    },
    {
      arguments: {
        pattern: `for start test next body`,
        textOnly: true,
        amount: 4,
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
