import { Lexer, WordToken } from './lexer';
import { TclError } from './tclerror';

export class Parser {
  lexer: Lexer;
  program: Program = {
    commands: [],
  };

  /**
   * Constructor for the parser, parses text with the lexer into a program
   *
   * @param  {string} input - Tcl code
   */
  public constructor(input: string) {
    // Initialize a new lexer with the given code
    this.lexer = new Lexer(input);

    // Loop over every available token
    let toProcess: WordToken | null = this.lexer.nextToken();
    while (toProcess) {
      // Check if the index of the current token is zero, this means that the token is a command and not an argument
      if (toProcess.index === 0) {
        // Push an empty commandtoken to the commands array
        this.program.commands.push({
          command: toProcess.value,
          args: [],
          source: toProcess.source,
          sourceLocation: toProcess.sourceLocation,
        });
      }
      // If not the token is an argument
      else {
        // Check if there is atleast 1 command in the commands array
        if (this.program.commands.length === 0)
          throw new TclError('encountered argument but no command exists');

        // Add the argument to the last command in the command list
        this.program.commands[this.program.commands.length - 1].args.push({
          value: toProcess.value,
          hasVariable: toProcess.hasVariable,
          hasSubExpr: toProcess.hasSubExpr,
          stopBackslash: toProcess.stopBackslash,
        });

        // Add the original tcl code
        this.program.commands[this.program.commands.length - 1].source =
          toProcess.source;
      }

      // Process next token
      toProcess = this.lexer.nextToken();
    }
  }

  /**
   * Return the processed program
   *
   * @returns Program - Processed program
   */
  public get(): Program {
    //writeFileSync('./test/dev/out.json', JSON.stringify(this.program, null, 2));
    //process.exit();
    return this.program;
  }
}

export interface Program {
  commands: Array<CommandToken>;
}

export interface CommandToken {
  command: string;
  args: Array<ArgToken>;
  source: string;
  sourceLocation: number;
}

export interface ArgToken {
  value: string;
  hasVariable: boolean;
  hasSubExpr: boolean;
  stopBackslash: boolean;
}

/*

Full Structure:
Program
  |
  Commands[
    Command
      |
      command
      args[
        Arg
          |
          index
          value
        Arg
          |
          index
          value
      ]
    Command
      |
      command
      args[
        Arg
          |
          index
          value
        Arg
          |
          index
          value
      ]
  ]
*/
