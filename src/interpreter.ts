import { Program, Parser, CommandToken } from './parser';
import { Scope } from './scope';
import { Tcl } from './tcl';
import { IO } from './io';
import { CommandHandler } from './commands';
import { WordToken } from './lexer';

export class Interpreter {
  program: Program;
  scope: Scope;
  lastValue: any;
  io: IO;
  commands: CommandHandler;

  constructor(tcl: Tcl, input: string, scope?: Scope) {
    let parser = new Parser(input);

    this.program = parser.get();
    this.scope = new Scope(scope);
    this.io = tcl.io;
    this.commands = tcl.commands;
  }

  run(): any {
    for (let command of this.program.commands) {
      this.lastValue = this.processCommand(command);
    }
    return this.lastValue;
  }

  private processCommand(command: CommandToken): any {

    let args = command.args.map((value: WordToken) => value.value);
    return this.commands.invoke(this, command.command, args);
  }
}
