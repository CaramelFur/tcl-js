import { Interpreter } from '../interpreter';
import {
  TclVariable,
  TclProcFunction,
  TclProcHelpers,
  TclSimple,
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
   * puts - Write to a channel.
   *
   * :: ?-nonewline? ?channelId? string
   *
   * @see https://wiki.tcl.tk/919
   */
  scope.defineProc(
    'puts',
    async (
      interpreter: Interpreter,
      args: Array<TclVariable>,
      command: CommandToken,
      helpers: TclProcHelpers,
    ): Promise<TclVariable> => {
      let nonewline = false;
      let channelId = 'stdout';
      let string = '';

      // Check if arguments are correct
      for (let arg of args) {
        if (!(arg instanceof TclSimple)) return helpers.sendHelp('wtype');
      }

      // Create a full expression by joining all arguments
      let stringArgs = args.map((arg) => arg.getValue());

      // Check for every corresponding argument mix and set variables accordingly
      if (stringArgs.length === 1) {
        string = stringArgs[0];
      } else if (stringArgs.length === 2 && stringArgs[0] === '-nonewline') {
        nonewline = true;
        string = stringArgs[1];
      } else if (stringArgs.length === 2) {
        channelId = stringArgs[0];
        string = stringArgs[1];
      } else if (stringArgs.length === 3 && stringArgs[0] === '-nonewline') {
        nonewline = true;
        channelId = stringArgs[1];
        string = stringArgs[2];
      } else {
        return helpers.sendHelp('wargs');
      }

      // NOTE: Tcl buffers output, meaning it may not be written immediately, but
      // can be forced with a flush command. I'm not going to worry about this
      // right now.

      // Write the values to the console with the correct settings
      interpreter.tcl.io.write(channelId, `${string}${nonewline ? '' : '\n'}`);

      return new TclSimple('');
    },
    {
      pattern: 'puts ?-nonewline? ?channelId? string',
      helpMessages: {
        wargs: `wrong # args`,
        wtype: `wrong type`,
      },
    },
  );
}
