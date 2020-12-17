import { TclCommand, TclComment, TclScript, TclWord } from './TclToken';
import TclParser from '../nearley/parsers/script';
import WordParser from '../nearley/parsers/word';
import ListParser from '../nearley/parsers/list';

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

  // Actually parse it with the generated parser
  const parsed: TclScript = TclParser(tcl);

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

export type ParsedWord = Array<AnyWordPart>;

export function ParseWord(word: string): ParsedWord {
  return WordParser(word);
}

export function ParseList(list: string): string[] {
  return ListParser(list).map((entry: TclWord) => entry.value);
}
