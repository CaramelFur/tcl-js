import { Program, Parser, CommandToken } from './parser';
import { Scope } from './scope';
import { Tcl } from './tcl';
import { WordToken } from './lexer';
import { TclSimple } from './types';
import { TclError } from './tclerror';

const variableRegex = /\$(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/g;

export class Interpreter {
  program: Program;
  scope: Scope;
  lastValue: any;
  tcl: Tcl;

  constructor(tcl: Tcl, input: string, scope: Scope) {
    let parser = new Parser(input);

    this.program = parser.get();
    this.scope = scope;
    this.tcl = tcl;
  }

  run(): any {
    for (let command of this.program.commands) {
      this.lastValue = this.processCommand(command);
    }
    return this.lastValue;
  }

  private processCommand(command: CommandToken): any {
    let args = command.args.map((arg: WordToken) => {
      if (arg.hasVariable) {
        let match = arg.value.match(variableRegex);
        if (match && match.length === 1 && match[0] === arg.value) {
          let regex = variableRegex.exec(arg.value);
          if (!regex || !regex.groups || !regex.groups.fullname)
            throw new TclError('Error parsing variable');
          return this.scope.resolve(regex.groups.fullname);
        }

        arg.value = arg.value.replace(variableRegex, (...regex) => {
          let groups: RegexVariable = regex[regex.length - 1];
          return `${this.scope.resolve(groups.fullname).getValue()}`;
        });
      }

      if (arg.hasSubExpr) {
        let subInterpreter = new Interpreter(
          this.tcl,
          arg.value,
          new Scope(this.scope),
        );
        arg.value = subInterpreter.run();
      }

      return new TclSimple(arg.value);
    });

    let wordArgs = args.map((arg) => arg.getValue());
    return this.scope.resolveProc(command.command).callback(this, wordArgs, args);
  }
}

interface RegexVariable {
  name: string;
  fullname: string;
  array: string | null;
  object: string | null;
}
