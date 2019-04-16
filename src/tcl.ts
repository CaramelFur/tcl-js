import { CommandHandler } from './commands';
import { Scope } from './scope';
import { IO } from './io';
import { Parser } from './parser';
import * as fs from 'fs';
import { Interpreter } from './interpreter';

export class Tcl {
  commands = new CommandHandler();
  globalScope: Scope = new Scope();
  io: IO = new IO();
  disabledCommands: Array<string> = [];

  constructor(disableCommands: Array<string>) {
    this.disabledCommands = disableCommands;
  }

  run(input: string): any {
    let interpreter = new Interpreter(this, input);
    return interpreter.run();
  }

  runFile(location: string) {
    let buffer: string = fs.readFileSync(location, { encoding: 'utf-8' });
    return this.run(buffer);
  }
}
