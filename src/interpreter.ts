import { Program, Parser, CommandToken, ArgToken } from './parser';
import { Scope } from './scope';
import { Tcl } from './tcl';
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
        let message = options.helpMessages[helpType] || 'Error';

        if (options.pattern) message += `: should be "${options.pattern}"`;

        // Throw an advanced error
        throw new TclError(
          `${message}\n    while reading: "${command.source}"\n    at line #${
            command.sourceLocation
          }\n`,
        );
      },
    };

    // Call the function
    return proc.callback(this, args, command, helpers);
  }

  /**
   * Processes arguments
   *
   * @param  {ArgToken} arg
   * @returns Promise
   */
  private async processArg(arg: ArgToken): Promise<TclVariable> {
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
      output = await this.deepProcessVariables(output);
    }

    // If the lexer has not determined to stop backslash processing, process all the backslashes
    if (!arg.stopBackslash && typeof output === 'string')
      output = this.processBackSlash(output);

    // Always replace escaped endlines
    if (typeof output === 'string') output = output.replace(/\\\n/g, ' ');

    // Return a new TclSimple with the previously set output
    return typeof output === 'string' ? new TclSimple(output) : output;
  }

  /**
   * Function to loop over every variable and solve all of them in order
   * 
   * @param  {string} input - The string to loop over
   * @param  {number=0} position - At what position in the string to start
   * @returns Promise - The solved result
   */
  public async deepProcessVariables(
    input: string,
    position: number = 0,
  ): Promise<TclVariable | string> {
    // Initialize output string
    let output = "";

    // Intitialize variable for every found variable
    let toProcess: FoundVariable | null;

    // Keep going as long as there are variables
    while ((toProcess = await this.resolveFirstVariable(input, position))) {
      // Add the string until the first found variable
      while (position < toProcess.startPosition){
        output += input.charAt(position);
        position++;
      }

      // Jump to the end of the variable
      position = toProcess.endPosition;

      // Return the full value if it corrresponds to the entire string
      if (toProcess.raw === input) return toProcess.value;
      // Otherwise add the result to the output
      output += toProcess.value.getValue();
    }

    // Add the last bit of the string
    while (position < input.length){
      output += input.charAt(position);
      position++;
    }

    return output;
  }

  /**
   * Function to read a string until the first found variable
   * It will then solve the variable and return that
   * 
   * @param  {string} input - The string that will be searched for variables
   * @param  {number=0} position - The position to start searching at
   * @returns Promise - The found results
   */
  private async resolveFirstVariable(
    input: string,
    position: number = 0,
  ): Promise<FoundVariable | null> {
    // Setup necessary variables
    let char = input.charAt(position);

    // Setup an output buffer
    let currentVar = {
      // Exmample: name(bracket)
      name: '',
      bracket: '',
      // Originalstring: $name(bracket)
      originalString: '',
      // If the variable is curly: ${curly(variable)}
      curly: false,
    };

    // Keep track if we are in a bracket () or not
    let inBracket = false;

    // Function to progress one char
    function read(appendOnOriginal: boolean) {
      if (appendOnOriginal) currentVar.originalString += char;
      position += 1;
      char = input.charAt(position);
    }

    // Keep reading string until a $ is found
    while (char !== '$' && position < input.length) {
      if (char === '\\') read(false);
      read(false);
    }
    // Check if it was not the end of the string that stopped us
    if (char !== '$') return null;
    char = <string>char;

    // Record the startposition of the variable
    let startPosition = position;

    // Eat the $ character
    read(true);

    // Check if the variable is curly
    if (char === '{') {
      currentVar.curly = true;
      read(true);
    }

    // While input is abvailable
    while (position < input.length) {
      // Check if we are within ()
      if (inBracket) {
        if (char === ')') {
          inBracket = false;
          read(true);
          break;
        }

        if (char === '$') {
          let replaceVar = await this.resolveFirstVariable(input, position);
          if (replaceVar) {
            while (position < replaceVar.endPosition) {
              read(true);
            }
            currentVar.bracket += replaceVar.value.getValue();
            continue;
          }
        }
      // If not
      } else {
        // Check if we should enter brackets
        if (char === '(') {
          inBracket = true;
          // Eat the ( character
          read(true);
          continue;
        }

        // If not check if the character is normal wordcharacter
        // Although this is only needed when we are not within {}
        if (!currentVar.curly && !char.match(/\w/g)) break;
      }

      // If the variable is curly and we hit an end }, break;
      if (currentVar.curly && char === '}') break;

      // Check for escape chars
      if (char === '\\') {
        if (inBracket) currentVar.bracket += char;
        else currentVar.name += char;
        read(true);
      }

      // Add the character to the corresponding string
      if (inBracket) currentVar.bracket += char;
      else currentVar.name += char;

      // Next char
      read(true);
    }

    // If the variable is curly check if we ended on an }
    if (currentVar.curly) {
      if (char !== '}') throw new TclError('unexpected end of string');
      // Eat the }
      read(true);
    }

    // Check if we did not just hit a lonesome $, if we did return the next variable
    if (currentVar.name === '')
      return this.resolveFirstVariable(input, position);

    // Initialize an index
    let index: string | number | null;

    /**
     * Commented out for future use, this should fix "set hello hello; puts $hello[expr 3]" from not running
     */
    let solved = currentVar.bracket;
    /*let solved = await this.processSquareBrackets(currentVar.bracket);
    if (typeof solved !== 'string') solved = solved.getValue();*/

    // Set the correct key
    if (solved === '') index = null;
    else if (isNumber(solved)) index = parseInt(solved, 10);
    else index = solved;

    // And return the solved variable with extra info
    return {
      raw: currentVar.originalString,
      startPosition,
      endPosition: position,
      value: this.getVariable(currentVar.name, index),
    };
  }

  /**
   * Grabs a variable with full name parsing: so "name" "name(obj)" and "name(3)" will all work
   *
   * @param  {string} variableName - The advanced variable name
   * @param  {string|number|null} variableKey - If necessary, the array or object key in the variable
   * @returns TclVariable - The resolved variable
   */
  public getVariable(
    variableName: string,
    variableKey: string | number | null,
  ): TclVariable {
    // Set the correct keys
    let name = variableName;
    let objectKey = typeof variableKey === 'string' ? variableKey : undefined;
    let arrayIndex = typeof variableKey === 'number' ? variableKey : undefined;

    // Get the corresponding value
    let value: TclVariable | null = this.scope.resolve(name);

    if (!value) throw new TclError(`can't read "${name}": no such variable`);

    // Check if an object key is present
    if (objectKey) {
      // Check if the value is indeed an object
      if (!(value instanceof TclObject))
        throw new TclError(`can't read "${name}": variable isn't object`);

      // Return the value at the given key
      return value.getSubValue(objectKey);
    }
    // Check if an array index is present
    else if (arrayIndex) {
      // Check if the value is indeed an array
      if (!(value instanceof TclArray))
        throw new TclError(`can't read "${name}": variable isn't array`);

      // Return the value at the given index
      return value.getSubValue(arrayIndex);
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
   * @param  {string|number|null} variableKey - If necessary, the array or object key in the variable
   * @param  {TclVariable} variable - The variable to put at that index
   */
  public setVariable(
    variableName: string,
    variableKey: string | number | null,
    variable: TclVariable,
  ) {
    // Set the correct keys
    let name = variableName;
    let objectKey = typeof variableKey === 'string' ? variableKey : undefined;
    let arrayIndex = typeof variableKey === 'number' ? variableKey : undefined;

    // Define an output
    let output: TclVariable = variable;

    // Read if the value is already present in the scope
    let existingValue: TclVariable | null = this.scope.resolve(name);

    // Check if an object key was parsed
    if (objectKey) {
      if (existingValue) {
        // If a value is already present, check if it is indeed an object
        if (!(existingValue instanceof TclObject))
          throw new TclError(
            `cant' set "${variableName}": variable isn't object`,
          );

        // Update the object with the value and return
        existingValue.set(objectKey, variable);
        return;
      }

      // Create a new object, add the value
      let obj = new TclObject(undefined, name);
      obj.set(objectKey, variable);

      // Put the new object in the output
      output = obj;
    }
    // Check an array index was parsed
    else if (arrayIndex) {
      if (existingValue) {
        // If a value is already present, check if it is indeed an array
        if (!(existingValue instanceof TclArray))
          throw new TclError(
            `cant' set "${variableName}": variable isn't array`,
          );

        // Update the array with the value and return
        existingValue.set(arrayIndex, variable);
        return;
      }

      // Create a new array, add the value
      let arr = new TclArray(undefined, name);
      arr.set(arrayIndex, variable);

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
              this.scope,
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
        } else if (depth < 0) throw new TclError('unexpected ]');
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
    let cleanUpBackRegex = /\\(?<character>.)/g;

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

        return groups.character;
      },
    );

    return input;
  }
}

/**
 * Checks if a variable is a number
 * 
 * @param  {any} input - The variable to check
 */
export function isNumber(input: any) {
  return !isNaN(<number>(<unknown>input)) && !isNaN(parseInt(input, 10));
}

// An interface for holding a found variable
interface FoundVariable {
  raw: string;
  startPosition: number;
  endPosition: number;
  value: TclVariable;
}
