import { ParseTcl, ParseWord } from '../parser';
import { TclCommand, TclComment, TclWord } from '../parser/TclToken';
import { TclOptions } from '../Tcl';
import { compileVarName, TclScope } from './TclScope';
import { TclVariable } from './variables/TclVariable';
import * as util from 'util';
import { lexer } from '../nearley/lexers/main';
import { TclSimpleVariable } from './variables/TclSimpleVariable';
import {
  AnyWordPart,
  TextPart,
  EscapePart,
  CodePart,
  VariablePart,
} from '../parser/WordToken';
import { TclError } from '../TclError';
import { ReplaceEscapeChar } from './HandleEscape';

const debugLexer = false;
const debugParser = false;

export class TclInterpreter {
  private options: TclOptions;
  private scope: TclScope;

  public constructor(options: TclOptions, scope?: TclScope) {
    this.options = options;
    this.scope = scope || new TclScope(options.disableCommands);
  }

  public run(code: string): TclVariable {
    if (debugLexer) {
      lexer.reset(code);
      // eslint-disable-next-line no-constant-condition
      while (1) {
        const e = lexer.next();
        if (!e) break;
        console.log(e.type, util.inspect(e.value));
      }
    }

    const astTree = ParseTcl(code);
    if (debugParser) console.log(util.inspect(astTree, false, Infinity, true));

    let lastValue: TclVariable = new TclSimpleVariable('');

    for (const command of astTree.commands) {
      if (command instanceof TclComment) continue;
      lastValue = this.runCommand(command);
    }

    return lastValue;
  }

  private runCommand(tclcommand: TclCommand): TclVariable {
    const words = tclcommand.words.map(this.SubstituteWord.bind(this));
    if (words.length === 0) {
      return new TclSimpleVariable('');
    }

    const command = words[0].toString();

    console.log('Executing:', command);

    return new TclSimpleVariable('');
  }

  private SubstituteWord(word: TclWord): TclVariable {
    const parsed = ParseWord(word.value);
    //parsed.forEach((p: any) => console.log(p.type, p.value));
    //console.log(word.value, ':', util.inspect(parsed, false, Infinity, true));

    const substituted = parsed.map(this.substitutePart.bind(this)).join('');

    console.log(
      word.value,
      ':',
      util.inspect(substituted, false, Infinity, true),
    );

    return new TclSimpleVariable(substituted);
  }

  private substitutePart(part: AnyWordPart): string {
    if (part instanceof TextPart) {
      return part.value;
    }

    if (part instanceof EscapePart) {
      switch (part.type) {
        case 'normal':
          return ReplaceEscapeChar(part.backslashValue);
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
      let index: string | null = null;
      if (part.index) {
        index = part.index.map(this.substitutePart.bind(this)).join('');
      }

      if (!this.scope.hasVariable(part.name)) {
        throw new TclError(
          `can't read "${compileVarName(part.name, index)}": no such variable`,
        );
      }

      const variable = this.scope.getVariable(part.name, index);

      return variable.toString();
    }

    throw new TclError('Encountered unkown object');
  }
}
