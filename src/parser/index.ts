import { TclComment, TclScript } from './TclToken';
import * as Parser from './generated/parser';

/**
 * Options you can give to the parser
 *
 * @export
 * @interface ParseOptions
 */
export interface ParseOptions {
  keepComments?: boolean;
}

/**
 * Parse function, this takes a tcl string and converts it to an ast
 *
 * @export
 * @param {string} tcl
 * @param {ParseOptions} [options={ keepComments: false }]
 * @returns {TclScript}
 */
export function parse(
  tcl: string,
  options: ParseOptions = { keepComments: false },
): TclScript {
  // We need to escape newlines before we start parsing, because weird tcl behaviour
  const endlineEscapedTclString = tcl.replace(/([^\\](\\\\)*)\\\n*/g, '$1 ');

  // Actually parse it with the generated parser
  const parsed: TclScript = Parser.parse(endlineEscapedTclString);

  // If keepComments isn't set we loop over all commands and filter out comment commands
  if (!options.keepComments) {
    for (let i = 0; i < parsed.commands.length; i++) {
      if (parsed.commands[i] instanceof TclComment) {
        parsed.commands.splice(i, 1);
      }
    }
  }

  return parsed;
}
