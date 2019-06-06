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
  ProcArgs,
} from './types';
import { TclError } from './tclerror';
import { Parser as MathParser } from './math/parser.js';

/**
 * Executes a tcl program
 *
 * @export
 * @class Interpreter
 */
export class Interpreter {
  private program: Program;

  private scope: Scope;
  private lastValue: TclVariable = new TclSimple('');
  private tcl: Tcl;

  /**
   * Creates an instance of Interpreter.
   *
   * @param {Tcl} tcl - The parent Tcl for keeping certain variables
   * @param {string} input - The input code you want to interpret
   * @param {Scope} scope - The scope you want to use
   * @memberof Interpreter
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
   * @returns {Promise<TclVariable>} - Value of the last command ran
   * @memberof Interpreter
   */
  public async run(): Promise<TclVariable> {
    for (let command of this.program.commands) {
      this.lastValue = await this.processCommand(command);

      // Check if it should stop running commands when hitting a break or continue
      let checkLoop = this.scope.getSetting('loop');
      if (checkLoop && typeof checkLoop !== 'boolean') {
        if (checkLoop.break || checkLoop.continue) break;
      }
    }
    return this.lastValue;
  }

  /**
   * Getter for the scope
   *
   * @returns {Scope}
   * @memberof Interpreter
   */
  public getScope(): Scope {
    return this.scope;
  }

  /**
   * Getter for the parent Tcl
   *
   * @returns {Tcl}
   * @memberof Interpreter
   */
  public getTcl(): Tcl {
    return this.tcl;
  }

  /**
   * This will reset the state of the interpreter, but keep the processed code
   *
   * @param {Scope} scope
   * @memberof Interpreter
   */
  public reset(scope?: Scope) {
    if (scope) this.scope = scope;
    this.lastValue = new TclSimple('');
  }

  /**
   * Internal function to process commands
   *
   * @private
   * @param {CommandToken} command - Command to process
   * @returns {Promise<TclVariable>} - Processed result
   * @memberof Interpreter
   */
  private async processCommand(command: CommandToken): Promise<TclVariable> {
    // Map the args from wordtokens to tclvariables
    let args: ProcArgs = [];
    for (let i = 0; i < command.args.length; i++) {
      let processed = await this.processArg(command.args[i]);

      if (command.args[i].expand) {
        let list = (<TclSimple>processed).getList();
        for(let j = 0; j < list.getLength(); j++){
          let item = list.getSubValue(j);
          (<TclVariable[]>args).push(item);
        }
      } else {
        (<TclVariable[]>args).push(processed);
      }
    }

    // Return the result of the associated function being called
    let proc = this.scope.resolveProc(command.command);
    // First check if function exists
    if (!proc) throw new TclError(`invalid command name "${command.command}"`);

    let options = (<TclProc>proc).options;

    // Setup helper functions
    let helpers: TclProcHelpers = {
      sendHelp: (helpType) => {
        let message = options.helpMessages[helpType] || 'Error';

        if (options.arguments.pattern)
          message += `: should be "${options.arguments.pattern}"`;

        // Throw an advanced error
        throw new TclError(
          `${message}\n    while reading: "${command.source}"\n    at line #${
            command.sourceLocation
          }\n`,
        );
      },
      solveExpression: async (expression) => {
        // Process the subexpressions and variables
        let processedExpression = await this.deepProcess(expression);

        // Check if it did not result in a string
        if (typeof processedExpression !== 'string') {
          // If so convert if possible, otherwise throw error
          if (processedExpression instanceof TclSimple)
            processedExpression = processedExpression.getValue();
          else throw new TclError('expression resolved to unusable value');
        }

        let parser = new MathParser();
        // Try to solve the expression and return the result
        let solvedExpression = parser.parse(processedExpression).evaluate();

        //Check if the result is usable
        if (typeof solvedExpression === 'string')
          solvedExpression = parseFloat(solvedExpression);
        if (typeof solvedExpression === 'boolean')
          solvedExpression = solvedExpression ? 1 : 0;
        if (typeof solvedExpression !== 'number')
          throw new TclError('expression resolved to unusable value');
        if (solvedExpression === Infinity)
          throw new TclError('expression result is infinity');

        return solvedExpression;
      },
    };

    // Check if the amount of arguments is correct
    // Set to -1 for infinite
    if (typeof options.arguments.amount === 'number') {
      if (
        args.length !== options.arguments.amount &&
        options.arguments.amount !== -1
      )
        return helpers.sendHelp('wargs');
    } else {
      if (
        (args.length < options.arguments.amount.start &&
          options.arguments.amount.start !== -1) ||
        (args.length > options.arguments.amount.end &&
          options.arguments.amount.end !== -1)
      )
        return helpers.sendHelp('wargs');
    }

    if (options.arguments.textOnly || options.arguments.simpleOnly) {
      // Check if arguments are correct if simpleonly
      for (let arg of args) {
        if (!(arg instanceof TclSimple)) return helpers.sendHelp('wtype');
      }
    }
    if (options.arguments.textOnly === true) {
      // Create a full expression by joining all arguments
      args = (<TclSimple[]>args).map((arg) => arg.getValue());
    }

    // Call the function
    return proc.callback(this, args, command, helpers);
  }

  /**
   * Processes arguments
   *
   * @private
   * @param {ArgToken} arg
   * @returns {Promise<TclVariable>}
   * @memberof Interpreter
   */
  private async processArg(arg: ArgToken): Promise<TclVariable> {
    // Define an output to return
    let output: string | TclVariable = arg.value;

    // Check if the lexer allows solving
    if (arg.hasVariable && arg.hasVariable && typeof output === 'string') {
      // If so, resolve those
      output = await this.deepProcess(output);
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
   * Function to go over a string and solve expressions and variables accordingly
   *
   * @param {string} input - The string to go over
   * @param {number} [position=0] - At what point to start in the string
   * @returns {(Promise<TclVariable | string>)} - The found results
   * @memberof Interpreter
   */
  public async deepProcess(
    input: string,
    position: number = 0,
  ): Promise<TclVariable | string> {
    // Initialize output string
    let output = '';

    // Intitialize variable for every found variable
    let toProcess: FoundVariable | null;

    // Keep going as long as there are variables
    while ((toProcess = await this.resolveFirst(input, position))) {
      // Add the string until the first found variable
      while (position < toProcess.startPosition) {
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
    while (position < input.length) {
      output += input.charAt(position);
      position++;
    }

    return output;
  }

  /**
   * Function to return the first resolved variable or subexpression
   *
   * @private
   * @param {string} input - What string to read for those expressions
   * @param {number} [position] - Where in the string to start searching
   * @returns {(Promise<FoundVariable | null>)} - The found result
   * @memberof Interpreter
   */
  private async resolveFirst(
    input: string,
    position: number,
  ): Promise<FoundVariable | null> {
    // Setup necessary variables
    let char = input.charAt(position);

    // Function to progress one char
    function read() {
      position += 1;
      char = input.charAt(position);
    }

    // Keep reading string until a something is found
    while (char !== '[' && char !== '$' && position < input.length) {
      if (char === '\\') read();
      read();
    }

    // Return the correct fix according to the found char
    if (char === '[') {
      return this.resolveFirstSquareBracket(input, position);
    } else if (char === '$') {
      return this.resolveFirstVariable(input, position);
    } else {
      return null;
    }
  }

  // Not necessary
  /**
   * Function to loop over every variable and solve all of them in order
   *
   * @param  {string} input - The string to loop over
   * @param  {number=0} position - At what position in the string to start
   * @returns Promise - The solved result
   */
  /*
  public async deepProcessVariables(
    input: string,
    position: number = 0,
  ): Promise<TclVariable | string> {
    // Initialize output string
    let output = '';

    // Intitialize variable for every found variable
    let toProcess: FoundVariable | null;

    // Keep going as long as there are variables
    while ((toProcess = await this.resolveFirstVariable(input, position))) {
      // Add the string until the first found variable
      while (position < toProcess.startPosition) {
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
    while (position < input.length) {
      output += input.charAt(position);
      position++;
    }

    return output;
  }
  */

  /**
   * Function to read a string until the first found variable
   * It will then solve the variable and return that
   *
   * @private
   * @param {string} input - The string that will be searched for variables
   * @param {number} [position=0] - The position to start searching at
   * @returns {(Promise<FoundVariable | null>)} - The found results
   * @memberof Interpreter
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

    /**
     * Function to progress one char
     *
     * @param {boolean} appendOnOriginal
     */
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

        // Solve any found variables
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

        // Solve any found subexpressions
        if (char === '[') {
          let replaceVar = await this.resolveFirstSquareBracket(
            input,
            position,
          );
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
        if (currentVar.curly) {
          if (inBracket) currentVar.bracket += char;
          else currentVar.name += char;
        }
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

    let solved = currentVar.bracket;

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
   * @param {string} variableName - The advanced variable name
   * @param {(string | number | null)} variableKey - If necessary, the array or object key in the variable
   * @returns {TclVariable} - The resolved variable
   * @memberof Interpreter
   */
  public getVariable(
    variableName: string,
    variableKey: string | number | null,
  ): TclVariable {
    // Set the correct keys
    let name = variableName;
    let objectKey = typeof variableKey === 'string' ? variableKey : null;
    let arrayIndex = typeof variableKey === 'number' ? variableKey : null;

    // Get the corresponding value
    let value: TclVariable | null = this.scope.resolve(name);

    if (!value) throw new TclError(`can't read "${name}": no such variable`);

    // Check if an object key is present
    if (objectKey !== null) {
      // Check if the value is indeed an object
      if (!(value instanceof TclObject))
        throw new TclError(`can't read "${name}": variable isn't object`);

      // Return the value at the given key
      return value.getSubValue(objectKey);
    }
    // Check if an array index is present
    else if (arrayIndex !== null) {
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
   * @param {string} variableName - The advanced variable name
   * @param {(string | number | null)} variableKey - If necessary, the array or object key in the variable
   * @param {TclVariable} variable - The variable to put at that index
   * @returns
   * @memberof Interpreter
   */
  public setVariable(
    variableName: string,
    variableKey: string | number | null,
    variable: TclVariable,
  ) {
    // Set the correct keys
    let name = variableName;
    let objectKey = typeof variableKey === 'string' ? variableKey : null;
    let arrayIndex = typeof variableKey === 'number' ? variableKey : null;

    // Define an output
    let output: TclVariable = variable;

    // Read if the value is already present in the scope
    let existingValue: TclVariable | null = this.scope.resolve(name);

    // Check if an object key was parsed
    if (objectKey !== null) {
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
    else if (arrayIndex !== null) {
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

  // Not needed
  /**
   * Function to go over a string and solve all square bracket subexpressions accordingly
   *
   * @param  {string} input - The string to loop over
   * @param  {number=0} position - The starting position in the string
   * @returns Promise - The found and processed results
   */
  /*
  private async deepProcessSquareBrackets(
    input: string,
    position: number = 0,
  ): Promise<string | TclVariable> {
    // Initialize output string
    let output = '';

    // Intitialize variable for every found variable
    let toProcess: FoundVariable | null;

    // Keep going as long as there are variables
    while (
      (toProcess = await this.resolveFirstSquareBracket(input, position))
    ) {
      // Add the string until the first found variable
      while (position < toProcess.startPosition) {
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
    while (position < input.length) {
      output += input.charAt(position);
      position++;
    }

    return output;
  }
  */

  /**
   * Function to find and resolve the first subexpression that it hits
   *
   * @private
   * @param {string} input - The input string
   * @param {number} position - Where in the string to start searching
   * @returns {(Promise<FoundVariable | null>)} - The processed output
   * @memberof Interpreter
   */
  private async resolveFirstSquareBracket(
    input: string,
    position: number,
  ): Promise<FoundVariable | null> {
    // Setup output buffer
    let outbuf = {
      originalString: '',
      startPosition: 0,
      endPosition: 0,
      expression: '',
      value: new TclVariable(''),
    };

    // Setup necessary variables
    let char = input.charAt(position);

    let depth = 0;

    // Function to progress one char
    function read(appendOnOriginal: boolean) {
      if (appendOnOriginal) outbuf.originalString += char;
      position += 1;
      char = input.charAt(position);
    }

    // Keep reading string until a [ is found
    while (char !== '[' && position < input.length) {
      if (char === '\\') read(false);
      read(false);
    }
    // Check if it was not the end of the string that stopped us
    if (char !== '[') return null;
    char = <string>char;

    outbuf.startPosition = position;

    // Eat the [ character
    read(true);
    depth = 1;

    // While input is abvailable
    while (position < input.length) {
      // Change depth based on character
      if (char === '[') {
        depth++;
      }

      if (char === ']') {
        depth--;
        if (depth === 0) break;
      }

      // Handle escapes
      if (char === '\\') {
        outbuf.expression += char;
        read(true);
      }
      // Move to the next char
      outbuf.expression += char;
      read(true);
    }

    // Check if depth is zero after loop, otherwise throw error
    if (depth !== 0) throw new TclError('incorrect amount of square brackets');

    read(true);

    let interpreter = new Interpreter(
      this.tcl,
      outbuf.expression,
      new Scope(this.scope),
    );
    outbuf.value = await interpreter.run();

    // And return the solved variable with extra info
    return {
      raw: outbuf.originalString,
      startPosition: outbuf.startPosition,
      endPosition: position,
      value: outbuf.value,
    };
  }

  /**
   * Function to replace all backslash sequences correctly
   *
   * @private
   * @param {string} input - The string to process
   * @returns {string} - The processed string
   * @memberof Interpreter
   */
  private processBackSlash(input: string): string {
    // Intialize all regexes
    let simpleBackRegex = /\\(?<letter>[abfnrtv])/g;
    let octalBackRegex = /\\0(?<octal>[0-7]{0,2})/g;
    let unicodeBackRegex = /\\u(?<hexcode>[0-9a-fA-F]{1,4})/g;
    let hexBackRegex = /\\x(?<hexcode>[0-9a-fA-F]{1,2})/g;
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
        let hex = parseInt(groups.hexcode.toLowerCase(), 16);
        return codeToChar(hex);
      },
    );

    // Replace the hexadecimal values
    input = input.replace(
      hexBackRegex,
      (...args: any[]): string => {
        let groups = args[args.length - 1];
        let hex = parseInt(groups.hexcode.toLowerCase(), 16);
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
 * @export
 * @param {*} input - The variable to check
 * @returns
 */
export function isNumber(input: any) {
  return !isNaN(<number>(<unknown>input)) && !isNaN(parseInt(input, 10));
}

/**
 * An interface for holding a found variable
 *
 * @interface FoundVariable
 */
interface FoundVariable {
  raw: string;
  startPosition: number;
  endPosition: number;
  value: TclVariable;
}
