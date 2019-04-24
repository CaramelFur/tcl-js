import { Interpreter } from '../interpreter';
import { TclVariable, TclSimple, TclProcFunction } from '../types';
import { Scope } from '../scope';
import { TclError } from '../tclerror';

let commands: { [index: string]: TclProcFunction } = {};

/**
 * list - creates a list
 *
 * :: ?arg arg ...?
 *
 * @see https://wiki.tcl-lang.org/page/list
 */

commands.list = (
  interpreter: Interpreter,
  args: Array<string>,
  varArgs: Array<TclVariable>,
): string => {
  // Add {} to every argument that has a space
  args = args.map(
    (arg: string): string => (arg.indexOf(' ') > -1 ? `{${arg}}` : arg),
  );

  // Return the arguments joined by spaces
  return args.join(' ');
};

/**
 * lindex — retrieves an element from a list or a nested list
 *
 * :: list ?index ...?
 * :: list indexList
 *
 * @see https://wiki.tcl-lang.org/page/unset
 */

commands.lindex = (
  interpreter: Interpreter,
  args: Array<string>,
  varArgs: Array<TclVariable>,
): string => {
  // Check if there are enough arguments
  if (args.length === 0)
    throw new TclError('wrong # args: should be "list list ?index ...?"');

  // Check if the first argument is a TclSimple
  // This is done because only that type can become a list
  if (!(varArgs[0] instanceof TclSimple))
    throw new TclError('expected list, did not receive list');

  // Create a number array
  let numArr: number[] = [];

  // Go over every next argument
  for (let i = 1; i < varArgs.length; i++) {
    // Check if the argument is TclSimple an a number
    if (!(varArgs[i] instanceof TclSimple) || !(<TclSimple>varArgs[i]).isNumber() )
      throw new TclError('expected number, did not recieve number');

    // Add the number to the array
    numArr[i - 1] = (<TclSimple>varArgs[i]).getNumber();
  }

  // Cast the first argument to TclSimple
  let simple: TclSimple = <TclSimple>varArgs[0];

  // Return the right index
  return simple
    .getList()
    .getSubValue(...numArr)
    .getValue();
};

/**
 * Function to load the procs into the scope
 *
 * @param  {Scope} scope
 */
export function Load(scope: Scope) {
  for (let command in commands) {
    scope.defineProc(command, commands[command]);
  }
}
