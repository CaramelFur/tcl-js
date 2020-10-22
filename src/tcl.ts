import { readFileSync } from 'fs';
import * as util from 'util';
import { TclScope } from './interpreter/scope';
import { parse } from './parser/';

const tclFile = readFileSync('test/test.tcl', 'utf-8');

let parsed = parse(tclFile);

console.log(util.inspect(parsed, false, Infinity, true));
const e = () => {
  console.log('hello');
};
//

/**
 * All possible options for the Tcl class
 *
 * @export
 * @interface TclOptions
 */
export interface TclOptions {
  disableCommands?: string[];
}

/**
 * The main Tcl class used for running Tcl code
 *
 * @export
 * @class Tcl
 */
export class Tcl {
  private options: TclOptions;
  private globalScope?: TclScope;

  /**
   * Creates an instance of Tcl
   * 
   * @param {TclOptions} options
   * @memberof Tcl
   */
  public constructor(options: TclOptions) {
    this.options = options || {};
  }

  public async run(code: string) {}

  /**
   * Return a copy of the current options
   *
   * @returns {TclOptions}
   * @memberof Tcl
   */
  public getOptions(): TclOptions {
    return { ...this.options };
  }
}
