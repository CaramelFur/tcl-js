import { IO } from './io';
import { Scope } from './scope';
import { CommandSet } from './commands';
import { Parse as parse } from './parser';
import { WordToken } from './lexer';

export class Tcl {
  currentScope: Scope = new Scope();
  io: IO = new IO();
  commands = new CommandSet(this);
  lastResult: any = null;

  disabledCommands: Array<string> = [];

  constructor(disableCommands: Array<string>) {
    this.disabledCommands = disableCommands;
  }

  run(input: string): any {
    const ast = parse(input);

    console.log(ast);

    for (let statement of ast.statements) {
      const [cmd, ...args] = statement.words.map(this.mapWord);
      this.lastResult = this.commands.invoke(cmd, args) || '';
    }

    return this.lastResult;
  }

  private mapWord(word: WordToken): string {
    let { value } = word;
    if (word.hasVariable) {
      value = value.replace(
        /\$\S+/g,
        (match: string): string => {
          return this.currentScope.resolve(match.slice(1)).value;
        },
      );
    }
    return value;
  }
}
