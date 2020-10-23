import * as util from 'util';
import { ParseWord } from '../parser';
import { TclWord } from '../parser/TclToken';
import {
  TextPart,
  EscapePart,
  AnyWordPart,
  CodePart,
  VariablePart,
} from '../parser/WordToken';
import { TclError } from '../TclError';
import { TclVariable } from './variables/TclVariable';

export default function SubstituteWord(word: TclWord): TclVariable {
  const parsed = ParseWord(word.value);
  //console.log(word.value, ':', util.inspect(parsed, false, Infinity, true));

  const substituted = parsed.map(substitutePart);

  console.log(
    word.value,
    ':',
    util.inspect(substituted.join(''), false, Infinity, true),
  );

  return new TclVariable(word.value);
}

function substitutePart(part: AnyWordPart): string {
  if (part instanceof TextPart) {
    return part.value;
  }

  if (part instanceof EscapePart) {
    switch (part.type) {
      case 'normal':
        return handleEscapeChar(part.backslashValue);
      case 'octal':
        return String.fromCharCode(parseInt(part.backslashValue, 8));
      case 'hex':
      case 'hex16':
      case 'hex32':
        return String.fromCharCode(parseInt(part.backslashValue, 16));
    }
  }

  if (part instanceof CodePart) {
    return '{code}';
  }

  if (part instanceof VariablePart) {
    return '{var}';
  }

  throw new TclError('Encountered unkown object');
}

const bakedEscapeChars: {
  [index: string]: number;
} = {
  a: 0x7,
  b: 0x8,
  f: 0xc,
  n: 0xa,
  r: 0xd,
  t: 0x9,
  v: 0xb,
};

const bakedEscapeCharsList = Object.keys(bakedEscapeChars);

function handleEscapeChar(char: string): string {
  if (bakedEscapeCharsList.indexOf(char) >= 0) {
    return String.fromCharCode(bakedEscapeChars[char]);
  }
  return char;
}
