import {
  TclVariableHolder,
  TclVariable,
  TclProc,
  TclProcHolder,
  TclProcFunction,
  TclProcOptionsEmpty,
} from './types';
import { LoadFunctions } from './commands';
import { TclError } from './tclerror';

type settingObj =
  | boolean
  | {
      [index: string]: boolean;
    };

/**
 * A class to keep track of all variables in an interpreter, and manage access to them
 *
 * @export
 * @class Scope
 */
export class Scope {
  parent: Scope | null = null;

  // Initialize two holders for variables and for procedures
  members: TclVariableHolder = {};
  procedures: TclProcHolder = {};
  settings: {
    [index: string]: settingObj;
  } = {};

  /**
   * Creates an instance of Scope.
   *
   * @param {Scope} [parent] - Parent scope, it will extract variables from here if it doesnt have then itself
   * @param {Array<string>} [disableProcs=[]] - A list of procedures you want disabled
   * @memberof Scope
   */
  public constructor(parent?: Scope, disableProcs: Array<string> = []) {
    // Set the scope if present
    if (parent) this.parent = parent;
    else {
      // If there is no scope parsed, load the base functions because you are the most upper parent
      for (let loadFunc of LoadFunctions) {
        loadFunc(this);
      }

      // Disable all requested procs
      for (let disFunc of disableProcs) {
        this.disableProc(disFunc);
      }
    }
  }

  // Not needed
  /**
   * Return the parent of the scope
   *
   * @returns Scope
   */
  /*
  public pop(): Scope | null {
    return this.parent;
  }*/

  /**
   * Define a variable in the current scope
   *
   * @param {string} name - The name of the variable
   * @param {TclVariable} value - The variable to put there
   * @returns {Scope} - The current scope
   * @memberof Scope
   */
  public define(name: string, value: TclVariable): Scope {
    // Try to define the variable in the top most scope
    if (this.parent !== null) {
      this.parent.define(name, value);
    } else {
      this.members[name] = value;
    }
    return this;
  }

  /**
   * Delete a variable from the scope
   *
   * @param {string} name - Name of the variable to be deleted
   * @param {boolean} [nocomplain] - If true, will throw error if variable does not exist
   * @returns {TclVariable} - The value of the deleted variable
   * @memberof Scope
   */
  public undefine(name: string, nocomplain?: boolean): TclVariable {
    // Check if variable exists
    if (!Object.prototype.hasOwnProperty.call(this.members, name)) {
      // If there is a parent, run their undefine function
      if (this.parent) return this.parent.undefine(name, nocomplain);
      // If not the variable does not exist, depending on the nocomplain it will throw an error
      else if (!nocomplain)
        throw new TclError(`can't unset "${name}": no such variable`);
    }

    // Delete the variable and return its value
    let returnValue = this.members[name];
    delete this.members[name];

    return returnValue;
  }

  /**
   * Resolves a variable and returns it
   *
   * @param {string} name - The name of the variable
   * @returns {(TclVariable | null)} - The variable requested, null if not found
   * @memberof Scope
   */
  public resolve(name: string): TclVariable | null {
    // Check this scope
    if (Object.prototype.hasOwnProperty.call(this.members, name)) {
      return this.members[name];
    }
    // Check the parent scopes recursively
    else if (this.parent !== null) {
      return this.parent.resolve(name);
    }

    // Return null if variable is not found
    return null;
  }

  // Not needed
  /**
   * Function to fetch all stored variables
   *
   * @returns TclVariable
   */
  /*
  public resolveAll(): TclVariable[] {
    let out: TclVariable[] = [];

    // Grab values from parent if exists
    if(this.parent) out = this.parent.resolveAll();

    // Grab own values
    let values = Object.values(this.members);

    // Stitch together and return
    return [...out, ...values];
  }*/

  /**
   * This is used to add a new function to the current scope
   *
   * @param {string} name - The name of the procedure
   * @param {TclProcFunction} callback - The js function that will be called to process the procedure
   * @param {TclProcOptionsEmpty} [options] - The options for the procedure
   * @memberof Scope
   */
  public defineProc(
    name: string,
    callback: TclProcFunction,
    options?: TclProcOptionsEmpty,
  ) {
    // Try to define the procedure in the top most scope
    if (this.parent !== null) {
      this.parent.defineProc(name, callback, options);
    } else {
      this.procedures[name] = new TclProc(name, callback, options);
    }
  }

  /**
   * This is used to remove a function from the current scope
   *
   * @param {string} name - The name of the procedure
   * @memberof Scope
   */
  public disableProc(name: string) {
    // Remove the procedure if it exists, if not throw an error
    if (Object.prototype.hasOwnProperty.call(this.procedures, name)) {
      delete this.procedures[name];
    } else {
      throw new TclError(`can't disable "${name}": no such function`);
    }
  }

  /**
   * This is used to request the scope for a procedure
   *
   * @param {string} name - The name of the procedure you want to get
   * @returns {(TclProc | null)} - An object containing the callback with its name, null if not found
   * @memberof Scope
   */

  public resolveProc(name: string): TclProc | null {
    // Check if this scope has the function and return if so
    if (Object.prototype.hasOwnProperty.call(this.procedures, name)) {
      return this.procedures[name];
    }
    // If not ask the parent scope and return if it has it
    else if (this.parent !== null) {
      return this.parent.resolveProc(name);
    }
    // Return null if the function is not found
    return null;
  }

  /**
   * Set a scoped setting
   *
   * @param {string} name - The name of the setting to set
   * @param {(boolean | null)} value - The value to put there, use null to remove setting
   * @memberof Scope
   */
  public setSetting(name: string, value: boolean | null) {
    if (value !== null) this.settings[name] = value;
    else delete this.settings[name];
  }

  /**
   * Set a sub setting, this will replace the main setting with an object
   *
   * @param {string} setting - The main setting to put the subsetting in
   * @param {string} subsetting - The name of the subsetting
   * @param {(boolean | null)} value - The value to put there, use null to remove setting
   * @returns {boolean} - If it succeeded
   * @memberof Scope
   */
  public setSubSetting(
    setting: string,
    subsetting: string,
    value: boolean | null,
  ): boolean {
    // Check if the setting is in this scope
    if (this.settings[setting] !== undefined) {
      // If the setting is still a boolean replace it with an object
      if (typeof this.settings[setting] === 'boolean')
        this.settings[setting] = {};

      // If the value to set is null, remove the subsetting
      if (value === null) {
        delete (<{ [index: string]: boolean }>this.settings[setting])[
          subsetting
        ];
      } 
      
      // Otherwise set the subsetting to the correct variable
      else {
        (<{ [index: string]: boolean }>this.settings[setting])[
          subsetting
        ] = value;
      }
      return true;
    } 

    // If not test in the parent
    else if (this.parent !== null) {
      return this.parent.setSubSetting(setting, subsetting, value);
    }
    
    // If there is no parent return false
    else return false;
  }

  /**
   * Get a scoped setting
   *
   * @param {string} name
   * @returns {(settingObj | null)}
   * @memberof Scope
   */
  public getSetting(name: string): settingObj | null {
    if (this.settings[name] !== undefined) return this.settings[name];
    else if (this.parent !== null) return this.parent.getSetting(name);
    else return null;
  }
}
