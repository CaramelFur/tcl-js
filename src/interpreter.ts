import { Program, Parser, CommandToken } from './parser';
import { Scope } from './scope';
import { Tcl } from './tcl';
import { WordToken } from './lexer';
import { TclSimple, TclVariable } from './types';
import { TclError } from './tclerror';

// A regex for finding variables in the code
const variableRegex = /(?<escaped>\\?)\$(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/g;

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
      .callback(this, wordArgs, args, command);
  }

  /**
   * Processes arguments
   *
   * @param  {WordToken} arg
   * @returns Promise
   */
  private async processArg(arg: WordToken): Promise<TclVariable> {
    // Check if the lexer has determined this argument has subexpressions
    if (arg.hasSubExpr) {
      // Process all subexpressions and set the value accordingly
      arg.value = await this.processSquareBrackets(arg.value);
    }

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

        // Check for escape string
        if (regex.groups.escaped === '\\')
          return new TclSimple(arg.value.replace(/\\\$/g, '$'));

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

          // Check for escape string
          if (groups.escaped === '\\') return `$${groups.fullname}`;

          // Return the resolved value to replace
          return `${this.scope.resolve(groups.fullname).getValue()}`;
        },
      );
    }

    // If the lexer has not determined to stop backslash processing, process all the backslashes
    if (!arg.stopBackslash) arg.value = this.processBackSlash(arg.value);

    // Return a new TclSimple with the previously set output
    return new TclSimple(arg.value);
  }

  /**
   * Function to loop over all the subexpressions in a string an resolve all of them in order
   *
   * @param  {string} input - The input string
   * @returns Promise - The processed output
   */
  private async processSquareBrackets(input: string): Promise<string> {
    // Initialize output string
    let output = input;

    // Setup necessary variables
    let depth = 0;
    let position = 0;
    let char = input.charAt(position);

    let lastExpression = '';

    // Function to progress one char
    function read() {
      position += 1;
      char = input.charAt(position);
    }

    // While input is abvailable
    while (position < input.length) {
      // If the current char is ] reduce the depth
      if (char === ']') {
        depth--;

        // If the depth has been reduced to zero
        if (depth === 0) {
          // Check if an expression was created
          if (lastExpression !== '') {
            // If so, create a new interpreter to process the expression
            let subInterpreter = new Interpreter(
              this.tcl,
              lastExpression,
              new Scope(this.scope),
            );

            // Grab the result
            let result = await subInterpreter.run();

            // Replace the output with the correct value
            output = output.replace(`[${lastExpression}]`, result);

            // Reset the expression for the next one
            lastExpression = '';
          }
        }
      }

      // If we are within square brackets, add the characters to the expression
      if (depth > 0) {
        lastExpression += char;
      }

      // If the character is [ increase the depth
      if (char === '[') depth++;

      // Move to the next char
      read();
    }

    // Check if depth is zero after loop, otherwise throw error
    if (depth !== 0) throw new TclError('incorrect amount of square brackets');

    return output;
  }

  /**
   * Function to replace all backslash sequences correctly
   * 
   * @param  {string} input - The string to process
   * @returns string - The processed string
   */
  private processBackSlash(input: string): string {
    // Intialize all regexes
    let simpleBackRegex = /\\(?<letter>[abfnrtv])/g;
    let octalBackRegex = /\\0(?<octal>[0-7]{0,2})/g;
    let unicodeBackRegex = /\\u(?<hexcode>[0-9a-fA-F]{1,4})/g;
    let hexBackRegex = /\\x(?<hexcode>[0-9a-fA-F]{0,2})/g;
    let cleanUpBackRegex = /\\(?<character>.|\n)/g;

    // Function to convert a number to the corresponding character
    function codeToChar(hexCode: number): string {
      return String.fromCharCode(hexCode);
    }

    // Replace all simple backslash sequences
    input = input.replace(
      simpleBackRegex,
      (...args: any[]): string => {
        let groups = args[args.length - 1];

        // Replace with the corresponding character depending on the letter
        switch (groups.letter) {
          case 'a':
            return codeToChar(0x07);
          case 'b':
            return codeToChar(0x08);
          case 'f':
            return codeToChar(0x0c);
          case 'n':
            return codeToChar(0x0a);
          case 'r':
            return codeToChar(0x0d);
          case 't':
            return codeToChar(0x09);
          case 'v':
            return codeToChar(0x0b);
          default:
            throw new TclError('program hit unreachable point');
        }
      },
    );

    // Replace the octal values
    input = input.replace(
      octalBackRegex,
      (...args: any[]): string => {
        let groups = args[args.length - 1];
        let octal = parseInt(groups.octal, 8);
        return codeToChar(octal);
      },
    );

    // Replace the unicode values
    input = input.replace(
      unicodeBackRegex,
      (...args: any[]): string => {
        let groups = args[args.length - 1];
        let hex = parseInt(groups.hexcode, 16);
        return codeToChar(hex);
      },
    );

    // Replace the hexadecimal values
    input = input.replace(
      hexBackRegex,
      (...args: any[]): string => {
        let groups = args[args.length - 1];
        let hex = parseInt(groups.hexcode, 16);
        return codeToChar(hex);
      },
    );

    // Replace all other backslashes with only the second character
    input = input.replace(
      cleanUpBackRegex,
      (...args: any[]): string => {
        let groups = args[args.length - 1];

        // Check for exceptions
        switch (groups.character) {
          case '\n':
            return ' ';
          default:
            return groups.character;
        }
      },
    );

    return input;
  }
}

// An interface for holding the result of the regex
interface RegexVariable {
  name: string;
  fullname: string;
  array: string | null;
  object: string | null;
  escaped: string;
}
