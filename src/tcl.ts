import { Scope } from './scope';
import { IO } from './io';
import * as fs from 'fs';
import { Interpreter } from './interpreter';
import {
  TclVariable,
  TclProcFunction,
  TclProcOptionsEmpty,
  TclSimple,
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
