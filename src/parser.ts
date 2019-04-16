import { Lexer, WordToken } from './lexer';

export class Parser {
  lexer: Lexer;
  program: Program = {
    commands: [],
  };

  constructor(input: string) {
    this.lexer = new Lexer(input);

    let toProcess = this.lexer.nextToken();
    while (toProcess) {
      if (toProcess.index === 0) {
        this.program.commands.push({
          command: toProcess.value,
          args: [],
        });
      } else {
        this.program.commands[this.program.commands.length - 1].args.push(
          toProcess,
        );
      }

      toProcess = this.lexer.nextToken();
    }
  }

  get(): Program {
    return this.program;
  }
}

export interface Program {
  commands: Array<CommandToken>;
}

export interface CommandToken {
  command: string;
  args: Array<WordToken>;
}
