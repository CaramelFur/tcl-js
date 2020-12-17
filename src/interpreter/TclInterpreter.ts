import { ParseTcl, ParseWord } from '../parser';
import { TclCommand, TclComment, TclWord } from '../parser/TclToken';
import { TclOptions } from '../Tcl';
import { compileVarName, TclScope } from './TclScope';
import { TclVariable } from './variables/TclVariable';
import * as util from 'util';
import { lexer as mainlexer } from '../nearley/lexers/main';
import { wordLexer as wordlexer } from '../nearley/lexers/word';
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

  public run(code: string): TclSimpleVariable {
    if (debugLexer) {
      console.log('Debug main lexer:');

      mainlexer.reset(code);
      // eslint-disable-next-line no-constant-condition
      while (1) {
        const e = mainlexer.next();
        if (!e) break;
        console.log(e.type, util.inspect(e.value));
      }
    }

    const astTree = ParseTcl(code);
    if (debugParser) {
      console.log('Debug main parser:');
      console.log(util.inspect(astTree, false, Infinity, true));
    }

    let lastValue: TclSimpleVariable = new TclSimpleVariable('');

    for (const command of astTree.commands) {
      if (command instanceof TclComment) continue;
      lastValue = this.runCommand(command);
    }

    return lastValue;
  }

  private runCommand(tclcommand: TclCommand): TclSimpleVariable {
    const words = this.SubstituteWords(tclcommand.words);

    if (words.length === 0) {
      return new TclSimpleVariable('');
    }

    const command = words[0].getValue();
    const commandargs = words.slice(1);

    const proc = this.scope.getCommandScope().getProc(command);
    const result = proc.handler(this, this.scope, commandargs);

    return result instanceof TclSimpleVariable
      ? result
      : new TclSimpleVariable();
  }

  private SubstituteWords(words: TclWord[]): TclSimpleVariable[] {
    const processedWords: TclSimpleVariable[] = [];

    for (const word of words) {
      const substituted = this.SubstituteWord(word);
      if (word.expand) {
        const expanded = substituted
          .toList()
          .map((value: string) => new TclSimpleVariable(value));
        processedWords.push(...expanded);
      } else {
        processedWords.push(substituted);
      }
    }

    return processedWords;
  }

  private SubstituteWord(word: TclWord): TclSimpleVariable {
    if (word.type === 'normal') {
      return new TclSimpleVariable(this.SubstituteStringWord(word.value));
    } else if (word.type === 'brace') {
      return new TclSimpleVariable(word.value);
    }

    return new TclSimpleVariable();
  }

  private SubstituteStringWord(word: string): string {
    if (debugLexer) {
      console.log('Debug word lexer:');
      wordlexer.reset(word);
      // eslint-disable-next-line no-constant-condition
      while (1) {
        const e = wordlexer.next();
        if (!e) break;
        console.log(e.type, util.inspect(e.value));
      }
    }

    const parsed = ParseWord(word);

    if (debugParser) {
      console.log('Debug word parser:');
      console.log(util.inspect(parsed, false, Infinity, true));
    }

    const substituted = parsed.map(this.SubstitutePart.bind(this)).join('');

    return substituted;
  }

  private SubstitutePart(part: AnyWordPart): string {
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
      const subInterpreter = new TclInterpreter(this.options, this.scope);
      const variable = subInterpreter.run(part.value).getValue();

      return variable;
    }

    if (part instanceof VariablePart) {
      let index: string | null = null;
      if (part.index) {
        index = part.index.map(this.SubstitutePart.bind(this)).join('');
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
