import { Program, Parser, CommandToken } from './parser';
import { Scope } from './scope';
import { Tcl } from './tcl';
import { IO } from './io';
import { CommandHandler } from './commands';
import { WordToken } from './lexer';

const variableRegex = /\$(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/g;

export class Interpreter {
  program: Program;
  scope: Scope;
  lastValue: any;
  tcl: Tcl;
  io: IO;
  commands: CommandHandler;

  constructor(tcl: Tcl, input: string, scope?: Scope) {
    let parser = new Parser(input);

    this.program = parser.get();
    this.scope = new Scope(scope);
    this.tcl = tcl;
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
    for (let arg of command.args) {
      if (arg.hasVariable) {
        arg.value = arg.value.replace(variableRegex, (...regex) => {
          let groups: RegexVariable = regex[regex.length - 1];
          return `${this.scope.resolve(groups.fullname)}`;
        });
      }

      if (arg.hasSubExpr) {
        let subInterpreter = new Interpreter(this.tcl, arg.value, this.scope);
        arg.value = subInterpreter.run();
      }
    }

    let args = command.args.map((value: WordToken) => value.value);
    return this.commands.invoke(this, command.command, args);
  }
}

interface RegexVariable {
  name: string;
  fullname: string;
  array: string | null;
  object: string | null;
}
