import { TclCommand, TclComment, TclScript } from './TclToken';
import TclParser from '../nearley/parsers/script';

import { AnyWordPart } from './WordToken';

/**
 * Options you can give to the parser
 *
 * @export
 * @interface TclParseOptions
 */
export interface TclParseOptions {
  keepComments?: boolean;
  keepNops?: boolean;
}

/**
 * Parse function, this takes a tcl string and converts it to an ast
 *
 * @export
 * @param {string} tcl
 * @param {TclParseOptions} [options={ keepComments: false }]
 * @returns {TclScript}
 */
export function ParseTcl(
  tcl: string,
  options: TclParseOptions = { keepComments: false, keepNops: false },
): TclScript {
  // We need to escape newlines before we start parsing, because weird tcl behaviour
  const endlineEscapedTclString = tcl.replace(/([^\\](\\\\)*)\\\n/g, '$1 ');

  // Actually parse it with the generated parser
  const parsed: TclScript = TclParser(endlineEscapedTclString);

  // If keepComments isn't set we loop over all commands and filter out comment commands
  if (!options.keepComments || !options.keepNops)
    for (let i = 0; i < parsed.commands.length; i++) {
      if (!options.keepComments && parsed.commands[i] instanceof TclComment) {
        parsed.commands.splice(i, 1);
        continue;
      }

      if (
        !options.keepNops &&
        parsed.commands[i] instanceof TclCommand &&
        (parsed.commands[i] as TclCommand).words.length === 0
      ) {
        parsed.commands.splice(i, 1);
        continue;
      }
    }

  return parsed;
}
