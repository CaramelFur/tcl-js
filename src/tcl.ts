import { CommandSet } from './commands';
import { Scope } from './scope';
import { IO } from './io';
import { Parser } from './parser';
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
    let parser = new Parser(input);
    return parser.get();
  }

  runFile(location: string) {
    let buffer: string = fs.readFileSync(location, { encoding: 'utf-8' });
    return this.run(buffer);
  }
}
