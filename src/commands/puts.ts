import { TclSimple } from '../types';
import { Scope } from '../scope';

/**
 * Function to load the procs into the scope
 *
 * @export
 * @param {Scope} scope
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
    async (interpreter, args, command, helpers) => {
      let nonewline = false;
      let channelId = 'stdout';
      let string = '';

      args = <string[]>args;

      // Check for every corresponding argument mix and set variables accordingly
      if (args.length === 1) {
        string = args[0];
      } else if (args.length === 2 && args[0] === '-nonewline') {
        nonewline = true;
        string = args[1];
      } else if (args.length === 2) {
        channelId = args[0];
        string = args[1];
      } else if (args.length === 3 && args[0] === '-nonewline') {
        nonewline = true;
        channelId = args[1];
        string = args[2];
      } else {
        return helpers.sendHelp('wargs');
      }

      // NOTE: Tcl buffers output, meaning it may not be written immediately, but
      // can be forced with a flush command. I'm not going to worry about this
      // right now.

      // Write the values to the console with the correct settings
      interpreter.getTcl().getIO().write(channelId, `${string}${nonewline ? '' : '\n'}`);

      return new TclSimple('');
    },
    {
      arguments: {
        pattern: 'puts ?-nonewline? ?channelId? string',
        textOnly: true,
      },
    },
  );
}
