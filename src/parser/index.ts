import {
  TclComment,
  TclScript,
  TclVariable,
  TclWordPartTypes,
  TclWordTypes,
} from './TclToken';
import * as Parser from './generated/parser';

export function parse(tcl: string): TclScript {
  const endlineEscapedTclString = tcl.replace(/\\\n[ \t]*/g, ' ');

  console.log(endlineEscapedTclString);

  const parsed = Parser.parse(endlineEscapedTclString);

  return parsed;
}
