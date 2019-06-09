import { TclSimple, TclVariable } from '../types';
import { Scope } from '../scope';
import { variableRegex, solveVar } from './basic';
import { TclError } from '../tclerror';

/**
 * Function to load the procs into the scope
 *
 * @export
 * @param {Scope} scope
 */
export function Load(scope: Scope) {
  /**
   * incr variable ?increment?
   *
   * @see https://wiki.tcl-lang.org/page/incr
   */
  scope.defineProc(
    'incr',
    (interpreter, orgs, command, helpers) => {
      let args = <TclSimple[]>orgs;
      let varName = args[0].getValue();
      let increment = 1;

      if (args[1]) {
        if (!args[1].isNumber())
          throw new TclError(
            `expected integer but got "${args[1].getValue()}"`,
          );
        else increment = args[1].getNumber();
      }

      let out: TclVariable;

      let solved = solveVar(varName, helpers);
      let fetched = interpreter.getScope().resolve(solved.name);

      if (!fetched) {
        out = new TclSimple(increment, solved.name);
      } else {
        if (!(fetched instanceof TclSimple)) return helpers.sendHelp('wtype');
        if (!fetched.isNumber())
          throw new TclError(
            `expected integer but got "${fetched.getValue()}"`,
          );

        out = new TclSimple(fetched.getNumber() + increment, fetched.getName());
      }

      interpreter.setVariable(solved.name, solved.key, out);
      return out;
    },
    {
      arguments: {
        pattern: 'incr variable ?increment?',
        amount: {
          start: 1,
          end: 2,
        },
        simpleOnly: true,
      },
    },
  );
}
