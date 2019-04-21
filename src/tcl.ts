import { Scope } from './scope';
import { IO } from './io';
import * as fs from 'fs';
import { Interpreter } from './interpreter';

export class Tcl {
  globalScope: Scope;
  io: IO = new IO();
  disabledCommands: Array<string> = [];

  /**
   * Initialize a full tcl interpreter, and disable any unwanted tcl commands
   *
   * @param  {Array<string>} disableCommands
   */
  public constructor(disableCommands: Array<string>) {
    this.disabledCommands = disableCommands;
    this.globalScope = new Scope(undefined, disableCommands);
  }

  /**
   * Run a string containing tcl code and return the last expression
   *
   * @param  {string} input
   * @returns Promise - Returns last string
   */
  public async run(input: string): Promise<string> {
    let interpreter = new Interpreter(this, input, this.globalScope);
    return interpreter.run();
  }

  /**
   * Run a file containing tcl code and return the last expression
   *
   * @param  {string} location
   * @returns Promise - Returns last string
   */
  public async runFile(location: string): Promise<string> {
    let buffer: string = fs.readFileSync(location, { encoding: 'utf-8' });
    return this.run(buffer);
  }
}
