import { Program, Parser, CommandToken } from './parser';
import { Scope } from './scope';
import { Tcl } from './tcl';
import { WordToken } from './lexer';
import { TclSimple, TclVariable } from './types';
import { TclError } from './tclerror';

// A regex for finding variables in the code
const variableRegex = /\$(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/g;

export class Interpreter {
  program: Program;
  scope: Scope;
  lastValue: string = '';
  tcl: Tcl;

  /**
   * Create a new interpreter with with a given code and scope
   *
   * @param  {Tcl} tcl - The parent Tcl for keeping certain variables
   * @param  {string} input - The input code you want to interpret
   * @param  {Scope} scope - The scope you wat
   */
  public constructor(tcl: Tcl, input: string, scope: Scope) {
    let parser = new Parser(input);

    this.program = parser.get();
    this.scope = scope;
    this.tcl = tcl;
  }

  /**
   * Actually runs the code
   *
   * @returns Promise - Value of the last command ran
   */
  public async run(): Promise<string> {
    for (let command of this.program.commands) {
      this.lastValue = await this.processCommand(command);
    }
    return this.lastValue;
  }

  /**
   * Internal function to process commands
   *
   * @param  {CommandToken} command - Command to process
   * @returns Promise - Processed result
   */
  private async processCommand(command: CommandToken): Promise<string> {
    // Map the args from wordtokens to tclvariables
    let args: TclVariable[] = [];
    for (let i = 0; i < command.args.length; i++) {
      args[i] = await this.processArg(command.args[i]);
    }

    // Create an array with the values of the previous variables
    let wordArgs = args.map(
      (arg: TclVariable): string => {
        // Use try catch incase we try to convert an object or array
        try {
          return arg.getValue();
        } catch (e) {
          return '';
        }
      },
    );

    // Return the result of the associated function being called
    return this.scope
      .resolveProc(command.command)
      .callback(this, wordArgs, args);
  }

  /**
   * Processes arguments
   *
   * @param  {WordToken} arg
   * @returns Promise
   */
  private async processArg(arg: WordToken): Promise<TclVariable> {
    // Check if lexer has already determined there might be a variable
    if (arg.hasVariable) {
      // If so run the regex over it
      let match = arg.value.match(variableRegex);

      // If there is a match, and the match matches the entire string
      if (match && match.length === 1 && match[0] === arg.value) {
        // Execute the regex again on the arg to find the groups
        let regex = variableRegex.exec(arg.value);

        // Check if groups are present
        if (!regex || !regex.groups || !regex.groups.fullname)
          throw new TclError('Error parsing variable');

        // Return the correct variable
        return this.scope.resolve(regex.groups.fullname);
      }
      // Code goes here if only part of the string matches the regex

      // Replace the regex with a function
      arg.value = arg.value.replace(
        variableRegex,
        (...regex: Array<any>): string => {
          // Parse the regex groups
          let groups: RegexVariable = regex[regex.length - 1];
          // Return the resolved value to replace
          return `${this.scope.resolve(groups.fullname).getValue()}`;
        },
      );
    }

    // Check if the lexer has determined this argument is a subexpression
    if (arg.hasSubExpr) {
      // Initialize a new interpreter with the same parent, the correct code and a deeper scope
      let subInterpreter = new Interpreter(
        this.tcl,
        arg.value,
        new Scope(this.scope),
      );

      // Set the value to the output
      arg.value = await subInterpreter.run();
    }

    // Return a new TclSimple with the previously set output
    return new TclSimple(arg.value);
  }
}

// An interface for holding the result of the regex
interface RegexVariable {
  name: string;
  fullname: string;
  array: string | null;
  object: string | null;
}
