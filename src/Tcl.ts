import * as fs from 'fs';
import { TclError } from './TclError';
import { TclVariable } from './interpreter/variables/TclVariable';
import { TclInterpreter } from './interpreter/TclInterpreter';

/**
 * All possible options for the Tcl class
 *
 * @export
 * @interface TclOptions
 */
export interface TclOptions {
  /**
   * Tell the interpreter to keep global variables between multiple calls to run()
   *
   * @type {boolean}
   * @memberof TclOptions
   */
  persistGlobals?: boolean;

  /**
   * Tell the interpreter which commands should be disabled
   *
   * @type {string[]}
   * @memberof TclOptions
   */
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
  private interpreter: TclInterpreter;

  /**
   * Creates an instance of Tcl
   *
   * @param {TclOptions} [options={
   *     disableCommands: [],
   *     persistGlobals: true,
   *   }]
   * @memberof Tcl
   */
  public constructor(
    options: TclOptions = {
      disableCommands: [],
      persistGlobals: true,
    },
  ) {
    this.options = options || {};
    this.interpreter = new TclInterpreter(this.options);
  }

  public async run(code: string): Promise<TclVariable> {
    return this.interpreter.run(code);
  }

  public async runFile(location: string) {
    let buffer: string = await new Promise((resolve, reject) => {
      fs.readFile(location, { encoding: 'utf-8' }, (err, data) => {
        if (err) reject(new TclError(err.message));
        resolve(data);
      });
    });

    return this.run(buffer);
  }

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
