import { CommandSet } from './commands';
import { Scope } from './scope';
import { IO } from './io';
import * as Lexer from './lexer';
import * as fs from 'fs';

export class Tcl {
  commands = new CommandSet(this);
  lastResult: any = null;
  scope: Scope = new Scope();
  io: IO = new IO();
  disabledCommands: Array<string> = [];

  constructor(disableCommands: Array<string>) {
    this.disabledCommands = disableCommands;
  }

  run(input: string): any {
    let llexer = new Lexer.LineLexer(input);
    while (true) {
      let token = llexer.nextToken();
      if (!token) break;
      console.log(token);
    }
    return;
  }

  runFile(location: string) {
    let buffer: string = fs.readFileSync(location, { encoding: 'utf-8' });
    return this.run(buffer);
  }
}
