import { Scope } from './scope';
import { IO } from './io';
import * as fs from 'fs';
import { Interpreter } from './interpreter';

export class Tcl {
  globalScope: Scope = new Scope();
  io: IO = new IO();
  disabledCommands: Array<string> = [];
  
  /**
   * Initialize a full tcl interpreter, and disable any unwanted tcl commands
   * 
   * @param  {Array<string>} disableCommands
   */
  constructor(disableCommands: Array<string>) {
    this.disabledCommands = disableCommands;
  }

  /**
   * Run a string containing tcl code and return the last expression
   * 
   * @param  {string} input
   * @returns any
   */
  run(input: string): any {
    let interpreter = new Interpreter(this, input, this.globalScope);
    return interpreter.run();
  }

  /**
   * Run a file containing tcl code and return the last expression
   * 
   * @param  {string} location
   * @returns any
   */
  runFile(location: string): any {
    let buffer: string = fs.readFileSync(location, { encoding: 'utf-8' });
    return this.run(buffer);
  }
}
