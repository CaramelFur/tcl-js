import {
  TclVariableHolder,
  TclVariable,
  TclProc,
  TclProcHolder,
  TclProcFunction,
} from './types';
import { LoadFunctions } from './commands';
import { TclError } from './tclerror';

export class Scope {
  parent: Scope | null = null;

  // Initialize two holders for variables and for procedures
  members: TclVariableHolder = {};
  procedures: TclProcHolder = {};

  /**
   * Construct a new scope
   *
   * @param  {Scope} parent? - Parent scope, it will extract variables from here if it doesnt have then itself
   * @param  {Array<string>=[]} disableProcs - A list of procs you want disabled
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

  /**
   * Return the parent of the scope
   *
   * @returns Scope
   */
  public pop(): Scope | null {
    return this.parent;
  }

  /**
   * Define a variable in the current scope
   *
   * @param  {string} name - The name of the variable
   * @param  {TclVariable} value - The variable to put there
   * @returns Scope - The current scope
   */
  public define(name: string, value: TclVariable): Scope {
    this.members[name] = value;
    return this;
  }

  /**
   * Delete a variable from the scope
   *
   * @param  {string} name - Name variable to be deleted
   * @param  {boolean} nocomplain? - If true, will throw error if variable does not exist
   * @returns TclVariable - The value of the deleted variable
   */
  public undefine(name: string, nocomplain?: boolean): TclVariable {
    // Check if variable exists
    if (!Object.prototype.hasOwnProperty.call(this.members, name)){
      // If there is a parent, run their undefine function
      if(this.parent) return this.parent.undefine(name, nocomplain);
      // If not the variable does not exist, depending on the nocomplain it will throw an error
      else if(!nocomplain) throw new TclError(`can't unset "${name}": no such variable`);
    }

    // Delete the variable and return its value
    let returnValue = this.members[name];
    delete this.members[name];
    return returnValue;
  }

  /**
   * Resolves a variable and returns it
   * 
   * @param  {string} name - The name of the variable
   * @returns TclVariable - The variable requested, null if not found
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

  /**
   * This is used to add a new function to the current scope
   *
   * @param  {string} name - The name of the procedure
   * @param  {TclProcFunction} callback - The js function that will be called to process the procedure
   */
  public defineProc(name: string, callback: TclProcFunction) {
    this.procedures[name] = new TclProc(name, callback);
  }

  /**
   * This is used to remove a function from the current scope
   *
   * @param  {string} name - The name of the procedure
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
   * @param  {string} name - The name of the procedure you want to get
   * @returns TclProc - An object containing the callback with its name, null if not found
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
}
