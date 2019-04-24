import { Program, Parser, CommandToken } from './parser';
import { Scope } from './scope';
import { Tcl } from './tcl';
import { WordToken } from './lexer';
import {
  TclSimple,
  TclVariable,
  TclObject,
  TclArray,
  TclList,
  TclProcHelpers,
  TclProc,
} from './types';
import { TclError } from './tclerror';

// A regex for finding variables in the code
const findVariableRegex = /(?<escaped>\\?)\$(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/g;

// A regex to convert a variable name to its base name with appended object keys or array indexes
const variableRegex = /(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/;

export class Interpreter {
  program: Program;
  scope: Scope;
  lastValue: TclVariable = new TclSimple('');
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
  public async run(): Promise<TclVariable> {
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
  private async processCommand(command: CommandToken): Promise<TclVariable> {
    // Map the args from wordtokens to tclvariables
    let args: TclVariable[] = [];
    for (let i = 0; i < command.args.length; i++) {
      args[i] = await this.processArg(command.args[i]);
    }

    // Return the result of the associated function being called
    let proc = this.scope.resolveProc(command.command);
    // First check if function exists
    if (!proc) throw new TclError(`invalid command name "${name}"`);

    // Setup helper functions
    let helpers: TclProcHelpers = {
      sendHelp: (helpType: string) => {
        let options = (<TclProc>proc).options;
        let message = options.helpMessages[helpType] || "Error";
        
        if(options.pattern) message += `: should be "${options.pattern}"`;

        throw new TclError(
          `${message}\nwhile reading: "${
            command.codeLine
          }"`,
        );
      },
    };

    // Call the function
    return proc.callback(this, args, command, helpers);
  }

  /**
   * Processes arguments
   *
   * @param  {WordToken} arg
   * @returns Promise
   */
  private async processArg(arg: WordToken): Promise<TclVariable> {
    // Define an output to return
    let output: string | TclVariable = arg.value;

    // Check if the lexer has determined this argument has subexpressions
    if (arg.hasSubExpr && typeof output === 'string') {
      // Process all subexpressions and set the value accordingly
      output = await this.processSquareBrackets(output);
    }

    // Check if lexer has already determined there might be a variable
    if (arg.hasVariable && typeof output === 'string') {
      // If so, resolve those
      output = this.processVariables(output);
    }

    // If the lexer has not determined to stop backslash processing, process all the backslashes
    if (!arg.stopBackslash && typeof output === 'string')
      output = this.processBackSlash(output);

    // Return a new TclSimple with the previously set output
    return typeof output === 'string' ? new TclSimple(output) : output;
  }

  /**
   * Function to resolve all variables in an argument
   *
   * @param  {string} input - The input argument
   * @returns TclVariable - The variable containing the resolved results
   */
  private processVariables(input: string): TclVariable {
    // If so run the regex over it
    let match = input.match(findVariableRegex);

    // If there is a match, and the match matches the entire string
    if (match && match.length === 1 && match[0] === input) {
      // Execute the regex again on the arg to find the groups
      let regex = findVariableRegex.exec(input);

      // Check if groups are present
      if (!regex || !regex.groups || !regex.groups.fullname)
        throw new TclError('Error parsing variable');

      // Check for escape string
      if (regex.groups.escaped === '\\')
        return new TclSimple(input.replace(/\\\$/g, '$'));

      // Return the correct variable
      return this.getVariable(regex.groups.fullname);
    }
    // Code goes here if only part of the string matches the regex

    // Replace the regex with a function
    input = input.replace(
      findVariableRegex,
      (...regex: Array<any>): string => {
        // Parse the regex groups
        let groups: RegexVariable = regex[regex.length - 1];

        // Check for escape string
        if (groups.escaped === '\\') return `$${groups.fullname}`;

        // Return the resolved value to replace
        return `${this.getVariable(groups.fullname).getValue()}`;
      },
    );

    // Return a variable with the processed string
    return new TclSimple(input);
  }

  /**
   * Grabs a variable with full name parsing: so "name" "name(obj)" and "name(3)" will all work
   *
   * @param  {string} variableName - The advanced variable name
   * @returns TclVariable - The resolved variable
   */
  public getVariable(variableName: string): TclVariable {
    // Run inputName through regex to check if name is valid
    let regex = variableRegex.exec(variableName);
    if (!regex || !regex.groups)
      throw new TclError(`can't read "${variableName}": invalid variable name`);

    // Extract the variable name from the regex
    let name = regex.groups.name;

    // Get the corresponding value
    let value: TclVariable | null = this.scope.resolve(name);

    if (!value) throw new TclError(`can't read "${name}": no such variable`);

    // Check if an object key is present
    if (regex.groups.object) {
      // Check if the value is indeed an object
      if (!(value instanceof TclObject))
        throw new TclError(`can't read "${name}": variable isn't object`);

      // Return the value at the given key
      return value.getSubValue(regex.groups.object);
    }
    // Check if an array index is present
    else if (regex.groups.array) {
      // Check if the value is indeed an array
      if (!(value instanceof TclArray))
        throw new TclError(`can't read "${name}": variable isn't array`);

      // Return the value at the given index
      let arrayNum = parseInt(regex.groups.array, 10);
      return value.getSubValue(arrayNum);
    }
    // If none are present, just return the value
    else {
      return value;
    }
  }

  /**
   * Sets a variable with full name parsing
   *
   * @param  {string} variableName - The advanced variable name
   * @param  {TclVariable} variable - The variable to put at that index
   */
  public setVariable(variableName: string, variable: TclVariable) {
    // Run the variableRegex over the inputname
    let regex = variableRegex.exec(variableName);

    // Check if the regex was succesful, if not throw an error
    if (!regex || !regex.groups)
      throw new TclError(`can't read "${variableName}": invalid variable name`);

    // Retrieve the variable name from ther regex
    let name = regex.groups.name;

    // Define an output
    let output: TclVariable = variable;

    // Read if the value is already present in the scope
    let existingValue: TclVariable | null = this.scope.resolve(name);

    // Check if an object key was parsed
    if (regex.groups.object) {
      if (existingValue) {
        // If a value is already present, check if it is indeed an object
        if (!(existingValue instanceof TclObject))
          throw new TclError(
            `cant' set "${variableName}": variable isn't object`,
          );

        // Update the object with the value and return
        existingValue.set(regex.groups.object, variable);
        return;
      }

      // Create a new object, add the value
      let obj = new TclObject(undefined, name);
      obj.set(regex.groups.object, variable);

      // Put the new object in the output
      output = obj;
    }
    // Check an array index was parsed
    else if (regex.groups.array) {
      // Convert the parsed arrayVar to an integer
      let arrayNum = parseInt(regex.groups.array, 10);

      if (existingValue) {
        // If a value is already present, check if it is indeed an array
        if (!(existingValue instanceof TclArray))
          throw new TclError(
            `cant' set "${variableName}": variable isn't array`,
          );

        // Update the array with the value and return
        existingValue.set(arrayNum, variable);
        return;
      }

      // Create a new array, add the value
      let arr = new TclArray(undefined, name);
      arr.set(arrayNum, variable);

      // Put the new array in the output
      output = arr;
    }
    // It is just a normal object
    else {
      // Check if the existingValue is not already a different object
      if (existingValue instanceof TclObject)
        throw new TclError(`cant' set "${variableName}": variable is object`);
      if (existingValue instanceof TclArray)
        throw new TclError(`cant' set "${variableName}": variable is array`);
      if (existingValue instanceof TclList)
        throw new TclError(`cant' set "${variableName}": variable is list`);
    }

    // Set the name
    output.setName(name);

    // Set the scope correctly
    this.scope.define(name, output);
    return;
  }

  /**
   * Function to loop over all the subexpressions in a string an resolve all of them in order
   *
   * @param  {string} input - The input string
   * @returns Promise - The processed output
   */
  private async processSquareBrackets(
    input: string,
  ): Promise<string | TclVariable> {
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

            let replaceVal = `[${lastExpression}]`;
            // If we just solved the entire string return the raw TclVariable
            if (output === replaceVal) return result;
            // Replace the output with the correct value
            output = output.replace(replaceVal, result.getValue());

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
