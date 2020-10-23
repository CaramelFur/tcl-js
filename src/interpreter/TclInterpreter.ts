import { ParseTcl } from '../parser';
import { TclCommand, TclComment } from '../parser/TclToken';
import { TclOptions } from '../Tcl';
import { TclScope } from './TclScope';
import { TclVariable } from './variables/TclVariable';
import * as util from 'util';
import SubstituteWord from './Substitutor';

export class TclInterpreter {
  private options: TclOptions;
  private scope: TclScope;

  public constructor(options: TclOptions, scope?: TclScope) {
    this.options = options;
    this.scope = scope || new TclScope(options.disableCommands);
  }

  public run(code: string): TclVariable {
    const astTree = ParseTcl(code);

    console.log(util.inspect(astTree, false, Infinity, true));

    let lastValue = new TclVariable();

    for (let command of astTree.commands) {
      if (command instanceof TclComment) continue;
      lastValue = this.runCommand(command);
    }

    return lastValue;
  }

  private runCommand(command: TclCommand): TclVariable {
    const words = command.words.map(SubstituteWord);

    return new TclVariable();
  }
}
