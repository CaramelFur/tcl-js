import { TclSimple } from '../types';
import { Scope } from '../scope';
import * as Is from '../is';
import { Interpreter } from '../interpreter';

/**
 * Function to load the procs into the scope
 *
 * @export
 * @param {Scope} scope
 */
export function Load(scope: Scope) {
  /**
   * if - creates a new command
   *
   * :: {expr1} ?then? {
   *    body1
   * } elseif {expr2} ?then? {
   *    body2
   * } elseif {
   *    ...
   * } ?else {
   *     bodyN
   * }?
   *
   * @see https://wiki.tcl-lang.org/page/if
   */
  scope.defineProc(
    'if',
    async (interpreter, args, command, helpers) => {
      args = <string[]>args;

      // Keep going as long as there are arguments
      while (args.length > 0) {
        // Solve the found expression
        let expression = <string>args.shift();
        let solved = await helpers.solveExpression(expression);

        // Grab the next code to run, and skip over the then if necessary
        let code = args.shift();
        if (code === 'then') code = args.shift();
        if (!code) return helpers.sendHelp('wargs');

        // check if the expression resulted in true
        if (Is.True(solved)) {
          // If so run the code and return the result

          // Interpret the procedures tcl code with the new scope
          let newInterpreter = new Interpreter(
            interpreter.tcl,
            code,
            interpreter.scope,
          );

          // Return the result
          return newInterpreter.run();
        }

        // The expression did not result in true

        // Grab the next operation
        let nextop = args.shift();

        // If it is else, execute the else statement and return
        if (nextop === 'else') {
          let code = args.shift();
          if (!code) return helpers.sendHelp('wargs');

          // Interpret the procedures tcl code with the new scope
          let newInterpreter = new Interpreter(
            interpreter.tcl,
            code,
            interpreter.scope,
          );

          // Return the result
          return newInterpreter.run();
        } 

        // If it is elseif, repeat the whole loop
        else if (nextop === 'elseif') {
          continue;
        }
        
        // If it is undefined (this means there are no more arguments), also continue, it will stop the loop
        else if (nextop === undefined) {
          continue;
        } 
        
        // Otherwise it is an undefined if operation
        else {
          return helpers.sendHelp('undefifop');
        }
      }

      return new TclSimple('');
    },
    {
      arguments: {
        pattern: `if {expr1} ?then? {body1} elseif {expr2} ?then? {body2} elseif {...} ?else {bodyN}?`,
        textOnly: true,
        amount: {
          start: 2,
          end: -1,
        },
      },
    },
  );
}
