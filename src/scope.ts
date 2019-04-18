import {
  TclVariableHolder,
  TclVariable,
  TclObject,
  TclArray,
  TclSimple,
  TclProc,
  TclProcHolder,
  TclProcFunction,
} from './types';
import { LoadFunctions } from './commands';
import { TclError } from './tclerror';

// A regex to convert a variable name to its base name with appended object keys or array indexes
const variableRegex = /(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/;

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
  constructor(parent?: Scope, disableProcs: Array<string> = []) {
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
  pop(): Scope | null {
    return this.parent;
  }

  /**
   * Define a variable in the current scope
   *
   * @param  {string} inputName - The name of the variable, this includes array/object brackets
   * @param  {string} inputValue - The raw string value you want to put in the variable
   * @returns Scope - The current scope
   */
  define(inputName: string, inputValue: string): Scope {
    // Run the variableRegex over the inputname
    let regex = variableRegex.exec(inputName);

    // Check if the regex was succesful, if not throw an error
    if (!regex || !regex.groups)
      throw new TclError(`can't read "${inputName}": invalid variable name`);

    // Retrieve the variable name from ther regex
    let name = regex.groups.name;

    // Create a TclSimple variable with the correct value and name
    let input = new TclSimple(inputValue, name);

    // Read if the value is already present in the scope
    let existingValue: TclVariable | undefined = this._resolve(name);

    // Check if an object key was parsed
    if (regex.groups.object) {
      if (existingValue) {
        // If a value is already present, check if it is indeed an object
        if (!(existingValue instanceof TclObject))
          throw new TclError(`cant' set "${inputName}: variable isn't object"`);

        // Update the object with the value and return
        existingValue.set(regex.groups.object, input);
        return this;
      }

      // Create a new object, add the value
      let obj = new TclObject(undefined, name);
      obj.set(regex.groups.object, input);

      // Put the new object in the existingValue
      existingValue = obj;
    }
    // Check an array index was parsed
    else if (regex.groups.array) {
      // Convert the parsed arrayVar to an integer
      let arrayNum = parseInt(regex.groups.array, 10);

      if (existingValue) {
        // If a value is already present, check if it is indeed an array
        if (!(existingValue instanceof TclArray))
          throw new TclError(`cant' set "${inputName}: variable isn't array"`);

        // Update the array with the value and return
        existingValue.set(arrayNum, input);
        return this;
      }

      // Create a new array, add the value
      let arr = new TclArray(undefined, name);
      arr.set(arrayNum, input);

      // Put the new array in the existingValue
      existingValue = arr;
    }
    // It is just a normal object
    else {
      // Check if the existingValue is not an object or array, otherwise throw an error
      if (existingValue instanceof TclObject)
        throw new TclError(`cant' set "${inputName}": variable is object`);
      if (existingValue instanceof TclArray)
        throw new TclError(`cant' set "${inputName}": variable is array`);

      // Check if value already exists
      if (existingValue) {
        // Set the value via a function
        // (This is done to update a variable if it has come from a parent scope)
        existingValue.setValue(inputValue);
        return this;
      }

      // Set the existingvalue to the new input
      existingValue = input;
    }

    // Update the scopes variable
    this.members[name] = existingValue;
    return this;
  }

  /**
   * Delete a variable from the scope
   *
   * @param  {string} name - Name variable to be deleted
   * @param  {boolean} nocomplain? - If true, will throw error if variable does not exist
   * @returns any - The value of the deleted variable
   */
  undefine(name: string, nocomplain?: boolean): any {
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
   * This function should only be used by the scope itself
   * It resolves a variable without throwing an error if it does not exist
   *
   * @param  {string} name
   * @returns TclVariable
   */
  _resolve(name: string): TclVariable | undefined {
    if (Object.prototype.hasOwnProperty.call(this.members, name)) {
      return this.members[name];
    } else if (this.parent !== null) {
      return this.parent._resolve(name);
    }
  }

  
  /**
   * Resolves a variable and returns it
   * 
   * @param  {string} inputName - The name of the variable
   * @returns TclVariable - The variable requested
   */
  resolve(inputName: string): TclVariable {
    // TODO: Add commenting to function
    let regex = variableRegex.exec(inputName);
    if (!regex || !regex.groups)
      throw new TclError(`can't read "${inputName}": invalid variable name`);

    let name = regex.groups.name;

    let testValue: TclVariable | undefined;

    if (Object.prototype.hasOwnProperty.call(this.members, name)) {
      testValue = this.members[name];
    } else if (this.parent !== null) {
      testValue = this.parent.resolve(name);
    }

    if (!testValue)
      throw new TclError(`can't read "${name}": no such variable`);

    let value: TclVariable = testValue;

    if (regex.groups.object) {
      if (!(value instanceof TclObject))
        throw new TclError(`can't read "${name}": variable isn't object`);
      return value.getSubValue(regex.groups.object);
    } else if (regex.groups.array) {
      if (!(value instanceof TclArray))
        throw new TclError(`can't read "${name}": variable isn't array`);
      let arrayNum = parseInt(regex.groups.array, 10);
      return value.getSubValue(arrayNum);
    } else {
      return value;
    }
  }

  /**
   * This is used to add a new function to the current scope
   *
   * @param  {string} name - The name of the procedure
   * @param  {TclProcFunction} callback - The js function that will be called to process the procedure
   */
  defineProc(name: string, callback: TclProcFunction) {
    this.procedures[name] = new TclProc(name, callback);
  }

  /**
   * This is used to remove a function from the current scope
   *
   * @param  {string} name - The name of the procedure
   */
  disableProc(name: string) {
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
   * @returns TclProc - An object containing the callback with its name
   */
  resolveProc(name: string): TclProc {
    // Check if this scope has the function and return if so
    if (Object.prototype.hasOwnProperty.call(this.procedures, name)) {
      return this.procedures[name];
    }
    // If not ask the parent scope and return if it has it
    else if (this.parent !== null) {
      return this.parent.resolveProc(name);
    }
    // If the parent scope does not have it throw an error
    throw new TclError(`invalid command name "${name}"`);
  }
}
