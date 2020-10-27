import { ParseTcl } from '../parser';
import { TclCommand, TclComment } from '../parser/TclToken';
import { TclOptions } from '../Tcl';
import { TclScope } from './TclScope';
import { TclVariable } from './variables/TclVariable';
import * as util from 'util';
import { SubstituteWord } from './Substitutor';
import { lexer } from '../nearley/lexers/main';

const debugLexer = false;

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

    console.log(util.inspect(astTree, false, Infinity, true));

    let lastValue = new TclVariable();

    for (const command of astTree.commands) {
      if (command instanceof TclComment) continue;
      lastValue = this.runCommand(command);
    }

    return lastValue;
  }

  private runCommand(command: TclCommand): TclVariable {
    const words = command.words.map(SubstituteWord);

    console.log('whoop');

    return new TclVariable();
  }
}
