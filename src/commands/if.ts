import { TclSimple } from '../types';
import { Scope } from '../scope';

/**
 * Function to load the procs into the scope
 *
 * @param  {Scope} scope
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
   * @see https://wiki.tcl-lang.org/page/proc
   */
  scope.defineProc(
    'if',
    (interpreter, args, command, helpers) => {
      return new TclSimple('');
    },
    {
      arguments: {
        pattern: `if name arguments body`,
      },
    },
  );
}
