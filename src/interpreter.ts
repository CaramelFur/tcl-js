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
  lastValue: any;
  tcl: Tcl;

  /**
   * Create a new interpreter with with a given code and scope
   *
   * @param  {Tcl} tcl - The parent Tcl for keeping certain variables
   * @param  {string} input - The input code you want to interpret
   * @param  {Scope} scope - The scope you wat
   */
  constructor(tcl: Tcl, input: string, scope: Scope) {
    let parser = new Parser(input);

    this.program = parser.get();
    this.scope = scope;
    this.tcl = tcl;
  }

  /**
   * Actually runs the code
   *
   * @returns any - Value of the last command ran
   */
  run(): any {
    for (let command of this.program.commands) {
      this.lastValue = this.processCommand(command);
    }
    return this.lastValue;
  }

  /**
   * Internal function to process commands
   *
   * @param  {CommandToken} command - Command to process
   * @returns any - Processed result
   */
  private processCommand(command: CommandToken): any {
    // Map the args from wordtokens to tclvariables
    // Also bind this to the process function, because the map function is being ran from somewhere else
    let args = command.args.map(this.processArg.bind(this));

    // Create an array with the values of the previous variables
    let wordArgs = args.map((arg: TclVariable): string => {
      // Use try catch incase we try to convert an object or array
      try {
        return arg.getValue();
      } catch (e) {
        return '';
      }
    });

    // Return the result of the associated function being called
    return this.scope
      .resolveProc(command.command)
      .callback(this, wordArgs, args);
  }

  private processArg(arg: WordToken): TclVariable {
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
      arg.value = arg.value.replace(variableRegex, (...regex: Array<any>): string => {
        // Parse the regex groups
        let groups: RegexVariable = regex[regex.length - 1];
        // Return the resolved value to replace
        return `${this.scope.resolve(groups.fullname).getValue()}`;
      });
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
      arg.value = subInterpreter.run();
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
