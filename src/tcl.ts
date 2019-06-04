import { Scope } from './scope';
import { IO } from './io';
import * as fs from 'fs';
import { Interpreter } from './interpreter';
import { TclVariable } from './types';
import { TclError } from './tclerror';

/**
 * The main class that will be imported, this handles the scope and all settings for the interpreter
 *
 * @export
 * @class Tcl
 */
export class Tcl {
  globalScope: Scope;
  io: IO = new IO();
  disabledCommands: Array<string> = [];

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
}
