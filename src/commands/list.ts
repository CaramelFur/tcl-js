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
   * list - creates a list
   *
   * :: ?arg arg ...?
   *
   * @see https://wiki.tcl-lang.org/page/list
   */
  scope.defineProc(
    'list',
    (
      interpreter: Interpreter,
      args: Array<TclVariable>,
      command: CommandToken,
      helpers: TclProcHelpers,
    ): TclVariable => {
      // Check if there are enough arguments
      if (args.length === 0) return helpers.sendHelp('warg');

      // Check if arguments are correct
      for (let arg of args) {
        if (!(arg instanceof TclSimple)) return helpers.sendHelp('wtype');
      }

      // Create a full expression by joining all arguments
      let stringArgs = args.map((arg) => arg.getValue());

      // Add {} to every argument that has a space
      stringArgs = stringArgs.map(
        (arg: string): string => (arg.indexOf(' ') > -1 ? `{${arg}}` : arg),
      );

      // Return the arguments joined by spaces
      return new TclSimple(stringArgs.join(' '));
    },
    {
      pattern: 'list ?arg arg ...?',
      helpMessages: {
        wargs: `wrong # args`,
        wtype: `wrong type`,
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
    (
      interpreter: Interpreter,
      args: Array<TclVariable>,
      command: CommandToken,
      helpers: TclProcHelpers,
    ): TclVariable => {
      // Check if there are enough arguments
      if (args.length === 0) throw new TclError('wrong # args: should be "');

      // Check if arguments are correct
      for (let arg of args) {
        if (!(arg instanceof TclSimple)) return helpers.sendHelp('wtype');
      }

      // Create a number array
      let numArr: number[] = [];

      // Go over every next argument
      for (let i = 1; i < args.length; i++) {
        // Check if the argument is TclSimple an a number
        if (!(<TclSimple>args[i]).isNumber()) return helpers.sendHelp('wtype');

        // Add the number to the array
        numArr[i - 1] = (<TclSimple>args[i]).getNumber();
      }

      // Cast the first argument to TclSimple
      let simple: TclSimple = <TclSimple>args[0];

      // Return the right index
      return simple.getList().getSubValue(...numArr);
    },
    {
      pattern: 'list list ?index ...?',
      helpMessages: {
        wargs: `wrong # args`,
        wtype: `wrong type`,
      },
    },
  );
}
