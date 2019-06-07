import { Scope } from './scope';
import { IO } from './io';
import * as fs from 'fs';
import { Interpreter } from './interpreter';
import {
  TclVariable,
  TclProcFunction,
  TclProcOptionsEmpty,
  TclSimple,
  TclArray,
  TclObject,
} from './types';
import { TclError } from './tclerror';

/**
 * The main class that will be imported, this handles the scope and all settings for the interpreter
 *
 * @export
 * @class Tcl
 */
export class Tcl {
  private globalScope: Scope;
  private io: IO = new IO();
  private disabledCommands: Array<string> = [];

  /**
   * Initialize a full tcl interpreter, and disable any unwanted tcl commands
   *
   * @param {Array<string>} [disableCommands] - An array of commands you do not want to use
   * @memberof Tcl
   */
  public constructor(disableCommands?: Array<string>) {
    if (disableCommands) this.disabledCommands = disableCommands;
    this.globalScope = new Scope(undefined, this.disabledCommands);
  }

  /**
   * Run a string containing tcl code and return the last expression
   *
   * @param {string} input
   * @returns {Promise<TclVariable>} - Returns last TclVariable
   * @memberof Tcl
   */
  public async run(input: string): Promise<TclVariable> {
    let interpreter = new Interpreter(this, input, new Scope(this.globalScope));
    return interpreter.run();
  }

  /**
   * Run a file containing tcl code and return the last expression
   *
   * @param {string} location
   * @returns {Promise<TclVariable>} - Returns last TclVariable
   * @memberof Tcl
   */
  public async runFile(location: string): Promise<TclVariable> {
    let buffer: string = await new Promise((resolve, reject) => {
      fs.readFile(location, { encoding: 'utf-8' }, (err, data) => {
        if (err) reject(new TclError(err.message));
        resolve(data);
      });
    });

    return this.run(buffer);
  }

  /**
   * Add an easy javascript function to tcl
   *
   * @param {string} name - The name of the function/command
   * @param {(...args: string[]) => string} procedure - The executed javascript function
   * @returns
   * @memberof Tcl
   */
  public addSimpleProcedure(
    name: string,
    procedure: (...args: string[]) => string,
  ) {
    return this.globalScope.defineProc(
      name,
      async (interpreter, inArgs, command, helpers) => {
        let out: string;

        // Convert the arguments to strings
        inArgs = <TclSimple[]>inArgs;
        let args: Array<string> = inArgs.map((arg) => arg.getValue());

        out = procedure(...args);

        if (!out) out = '';

        return new TclSimple(out);
      },
      { arguments: { simpleOnly: true } },
    );
  }

  /**
   * Add an advanced javascript function to tcl
   *
   * @param {string} name - The name of the function/command
   * @param {TclProcFunction} procedure - The executed javascript function
   * @param {(TclProcOptionsEmpty | undefined)} settings - Extra information about the function
   * @returns
   * @memberof Tcl
   */
  public addAdvancedProcedure(
    name: string,
    procedure: TclProcFunction,
    settings: TclProcOptionsEmpty | undefined,
  ) {
    return this.globalScope.defineProc(name, procedure, settings);
  }

  /**
   * Set a variable in the tcl interpreter
   *
   * @param {string} name - The name of the variable
   * @param {possibleVariable} variable - The contents of the variable, nested arrays and objects will not work properly
   * @param {boolean} [force] - If true, will ignore previously set variables
   * @memberof Tcl
   */
  public setVariable(
    name: string,
    variable: possibleVariable,
    force?: boolean,
  ) {
    // Check if the variable is not already set
    if (!force) {
      let test = this.globalScope.resolve(name);
      if (test) throw new Error('Variable ' + name + ' has already been set!');
    }

    // If variable is an array
    if (Array.isArray(variable)) {
      // Initialize an empty array to return
      let saveVar = new TclArray(undefined, name);

      // Loop over every item
      for (let i = 0; i < variable.length; i++) {
        let item = variable[i];
        let converted: string;

        // Convert the item to a string
        if (
          typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean'
        ) {
          converted = item.toString();
        } else {
          converted = item.toString();
        }

        // Create a TclSimple to hold the string, and store in the array
        let saveSimple = new TclSimple(converted);
        saveVar.set(i, saveSimple);
      }

      // Save the array
      this.globalScope.define(name, saveVar);
      return true;
    }

    // If variable is an object
    else if (variable instanceof Object) {
      // Initialize an empty object to return
      let saveVar = new TclObject(undefined, name);

      // Loop over every item
      for (let key of Object.keys(variable)) {
        let item = variable[key];
        let converted: string;

        // Convert the item to a string
        if (
          typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean'
        ) {
          converted = item.toString();
        } else {
          converted = item.toString();
        }

        // Create a TclSimple to hold the string, and store in the array
        let saveSimple = new TclSimple(converted);
        saveVar.set(key, saveSimple);
      }

      // Save the object
      this.globalScope.define(name, saveVar);
      return true;
    }

    // If string number or boolean
    else if (
      typeof variable === 'string' ||
      typeof variable === 'number' ||
      typeof variable === 'boolean'
    ) {
      // Convert the variable
      let out = variable.toString();

      // Create a variable and save it
      let saveVar = new TclSimple(out, name);
      this.globalScope.define(name, saveVar);
      return true;
    } else {
      throw new Error('Unsupported variable type!');
    }
  }

  /**
   * Get a variable that was created in the tcl script
   *
   * @param {string} name - The name of the variable you wish to retrieve
   * @returns {possibleVariable} - The contents of the given variable
   * @memberof Tcl
   */
  public getVariable(name: string, force?: boolean): possibleVariable {
    // Check if the variable exists
    let gotten = this.globalScope.resolve(name);
    if (!gotten) {
      if (!force) throw new Error('Could not find variable');
      else return '';
    }

    // Is the variable a TclSimple
    if (gotten instanceof TclSimple) {
      if (gotten.isNumber()) return gotten.getNumber();
      else if (gotten.isBoolean()) return gotten.getBoolean();
      else return gotten.getValue();
    }

    // Is it a TclArray
    else if (gotten instanceof TclArray) {
      // Create an out value
      let out: any[] = [];

      let length = gotten.getLength();

      // Loop over all items
      for (let i = 0; i < length; i++) {
        // Get the item at the given index
        let item = gotten.getSubValue(i, true);

        // Add its number value if it can, otherwise add the value
        if (item instanceof TclSimple && item.isNumber())
          out.push(item.getNumber());
        else if (item instanceof TclSimple && item.isBoolean())
          out.push(item.getBoolean());
        else out.push(item.getValue());
      }

      // Return the completed array
      return out;
    }

    // Is it a TclObject
    else if (gotten instanceof TclObject) {
      // Intiialize a return value
      let out: { [index: string]: string | number | boolean } = {};
      let keys = gotten.getKeys();

      // Loop over every entry
      for (let key of keys) {
        // Grab the given item
        let item = gotten.getSubValue(key);

        // Add its number value if it can, otherwise add the value
        if (item instanceof TclSimple && item.isNumber())
          out[key] = item.getNumber();
        else if (item instanceof TclSimple && item.isBoolean())
          out[key] = item.getBoolean();
        else out[key] = item.getValue();
      }

      // Return the finished object
      return out;
    }

    // If no compatible type was found throw error
    else {
      if (!force) throw new Error('Could not convert variable to js equivalent');
      else return '';
    }
  }

  /**
   * Function to get all disabled commands
   *
   * @type {Array<string>}
   * @memberof Tcl
   */
  public getDisabledCommands(): Array<string> {
    return this.disabledCommands;
  }

  /**
   * Function to get the IO class
   *
   * @type {IO}
   * @memberof Tcl
   */
  public getIO(): IO {
    return this.io;
  }
}

// All types you set as a variable in tcl
type possibleVariable =
  | string
  | number
  | boolean
  | any[]
  | { [index: string]: any };
