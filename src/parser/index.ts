import { TclComment, TclScript } from './TclToken';
import * as TclParser from '../pegjs/parsers/script';
import * as WordParser from '../pegjs/parsers/word';
import {
  TextPart,
  EscapePart,
  CodePart,
  VariablePart,
  AnyWordPart,
} from './WordToken';

/**
 * Options you can give to the parser
 *
 * @export
 * @interface TclParseOptions
 */
export interface TclParseOptions {
  keepComments?: boolean;
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
  options: TclParseOptions = { keepComments: false },
): TclScript {
  // We need to escape newlines before we start parsing, because weird tcl behaviour
  const endlineEscapedTclString = tcl.replace(/([^\\](\\\\)*)\\\n/g, '$1 ');

  // Actually parse it with the generated parser
  const parsed: TclScript = TclParser.parse(endlineEscapedTclString);

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

export type ParsedWord = Array<AnyWordPart>;
export function ParseWord(word: string): ParsedWord {
  return WordParser.parse(word);
}
