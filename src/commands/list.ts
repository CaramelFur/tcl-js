import { TclSimple } from '../types';
import { Scope } from '../scope';

/**
 * Function to load the procs into the scope
 *
 * @param  {Scope} scope
 */
export function Load(scope: Scope) {
  /**
   * list - creates a list
   *
   * :: ?arg arg ...?
   *
   * @see https://wiki.tcl-lang.org/page/list
   */
  scope.defineProc(
    'list',
    (interpreter, args, command, helpers) => {
      args = <string[]>args;

      // Add {} to every argument that has a space
      args = args.map(
        (arg: string): string => (arg.indexOf(' ') > -1 ? `{${arg}}` : arg),
      );

      // Return the arguments joined by spaces
      return new TclSimple(args.join(' '));
    },
    {
      arguments: {
        pattern: 'list ?arg arg ...?',
        amount: {
          start: 1,
          end: -1,
        },
        textOnly: true,
      },
    },
  );

  /**
   * lindex — retrieves an element from a list or a nested list
   *
   * :: list ?index ...?
   * :: list indexList
   *
   * @see https://wiki.tcl-lang.org/page/unset
   */
  scope.defineProc(
    'lindex',
    (interpreter, oldArgs, command, helpers) => {
      let args = <TclSimple[]>oldArgs;

      // Create a number array
      let numArr: number[] = [];

      // Go over every next argument
      for (let i = 1; i < args.length; i++) {
        // Check if the argument is TclSimple an a number
        if (!args[i].isNumber()) return helpers.sendHelp('wtype');

        // Add the number to the array
        numArr[i - 1] = (<TclSimple>args[i]).getNumber();
      }

      // Cast the first argument to TclSimple
      let simple: TclSimple = <TclSimple>args[0];

      // Return the right index
      return simple.getList().getSubValue(...numArr);
    },
    {
      arguments: {
        pattern: 'list list ?index ...?',
        amount: {
          start: 1,
          end: -1,
        },
        simpleOnly: true,
      },
    },
  );
}
