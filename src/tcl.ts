import { IO } from './io';
import { Scope } from './scope';
import { CommandSet } from './commands';
import { Parse as parse } from './parser';
import { WordToken } from './lexer';
import * as fs from 'fs';

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

    console.log(JSON.stringify(ast));

    for (let statement of ast.statements) {
      const [cmd, ...args] = statement.words.map(this.mapWord);
      this.lastResult = this.commands.invoke(cmd, args) || '';
    }

    return this.lastResult;
  }

  runFile(location: string) {
    let buffer: string = fs.readFileSync(location, { encoding: 'utf-8' });
    return this.run(buffer);
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
