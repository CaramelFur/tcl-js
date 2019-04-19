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
  constructor(input: string) {
    // Initialize a new lexer with the given code
    this.lexer = new Lexer(input);

    // Loop over every available token
    let toProcess = this.lexer.nextToken();
    while (toProcess) {
      console.log(toProcess)

      // Check if the index of the current token is zero, this means that the token is a command and not an argument
      if (toProcess.index === 0) {
        // Push an empty commandtoken to the commands array
        this.program.commands.push({
          command: toProcess.value,
          args: [],
        });
      } 
      // If not the token is an argument
      else {
        // Check if there is atleast 1 command in the commands array
        if(this.program.commands.length === 0) throw new TclError('encountered argument but no command exists');

        // Add the argument to the last command in the command list
        this.program.commands[this.program.commands.length - 1].args.push(
          toProcess,
        );
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

/*

Full Structure:
Program
  |
  Commands[
    Command
      |
      command
      args[
        Word
          |
          index
          value
        Word
          |
          index
          value
      ]
    Command
      |
      command
      args[
        Word
          |
          index
          value
        Word
          |
          index
          value
      ]
  ]
*/
