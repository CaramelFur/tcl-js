import * as Is from './is';
import { TclError } from './tclerror';
import { Interpreter } from './interpreter';

export class TclVariable {
  protected value: any = '';
  protected name: string | undefined = undefined;

  /**
   * Construct a parent TclVariable, you should never be directly constructing this object.
   *
   * @param  {any} value
   * @param  {string} name?
   */
  public constructor(value: any, name?: string) {
    this.value = value;
    if (name) this.name = name;
  }

  /**
   * Get the value of any tcl type, this will always be a string
   *
   * @returns string
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Set the value of any tcl type, this can be anything
   *
   * @param  {any} value
   * @returns any
   */
  public setValue(value: any): any {
    this.value = value;
    return value;
  }

  /**
   * This function is only used in the case of lists, arrays and objects
   * If the class is not one of these it will return undefined
   *
   * @param  {any} key?
   * @returns any
   */
  public getSubValue(key?: any): any {
    return undefined;
  }

  /**
   * This function should not be used but is here in case you need it for testing
   * It return the raw interal data storage of the variable
   *
   * @returns any
   */
  public getRawValue(): any {
    return this.value;
  }

  /**
   * This function returns the name of the variable, as long as it has one
   *
   * @returns string
   */
  public getName(): string | undefined {
    return this.name;
  }

  /**
   * This function is used to retrieve the number from the variable, as long as it is a numbervariable
   *
   * @param  {boolean} isInt?
   * @returns number
   */
  public getNumber(isInt?: boolean): number | undefined {
    return undefined;
  }

  /**
   * Check if the variable is a number
   *
   * @returns boolean
   */
  public isNumber(): boolean {
    return false;
  }
}

export class TclList extends TclVariable {
  /**
   * Construct a tcl list type, it receives a string as input and parses it on construction
   *
   * @param  {string} value
   * @param  {string} name?
   */
  public constructor(value: string, name?: string) {
    super([], name);
    this.destruct(value);
  }

  /**
   * Called to parse a string into the internal value array
   *
   * @param  {string} input - The list input you want to parse
   * @returns void
   */
  private destruct(input: string): void {
    // Initialize a counter for keeping track of the posisition in the string
    let idx = 0;
    // Initialize a char with the first character of the string
    let char = input.charAt(idx);

    /**
     * This function is used for progressing to the next char in the string
     *
     * @returns string - This is the previous char
     */
    function read(): string {
      let old = char;
      idx += 1;
      char = input.charAt(idx);
      return old;
    }

    /**
     * This function is used to parse the braces in lists
     *
     * This is because words enclosed in bracets should be seen as one list item
     * E.g. 'hi {hello there}' => ['hi', 'hello there']
     * and 'hi {this is a {nested list}} wow' => ['hi', 'this is a {nested list}', 'wow']
     *
     * @param  {number=0} depth - This is a begin value of how many brackets deep the parser is
     * @returns string
     */
    function parseBrace(depth: number = 0): string {
      // Initialize a string to keep the return value
      let returnVar = '';

      // Discard the first char because we do not want the first '{' to be included in the final string
      read();

      // Keep reading the string as long as we are inside one or more brackets
      while (depth > 0) {
        // Add the next character to the output
        returnVar += read();

        // Increase or decrease the depth depending on the brackets
        if (char === '{') depth++;
        if (char === '}') depth--;
      }

      // This is true when there are more closing brackets than opening brackets
      if (depth < 0) throw new TclError('incorrect brackets in list');

      // Discard the last char because we do not want the last '}' to be included in the final string
      read();

      return returnVar;
    }

    // Initialize a counter for keeping track of the current list index
    let i = 0;

    // Keep reading until there is no more string to read
    while (idx < input.length) {
      // Initialize an empty string to contain the next list item
      let tempWord = '';

      // Keep reading until the current character is a wordseperator or there is no more string to read
      while (!Is.WordSeparator(char) && idx < input.length) {
        if (char === '{') {
          // If the current char is '}', that means we need to read until the last }

          // If there is already data in tempWord we throw an error, because you are not supposed to attach text to a sublist
          if (tempWord !== '') throw new TclError('unexpected {');

          // Set the list item at the current index to the parsed braces
          this.value[i] = new TclSimple(parseBrace(1));
        } else {
          // The current character is just a normal character

          // Check if the item at the current list index is still empty
          // If not that means that we have aleady encountered a sublist and are not supposed to be processing text again
          if (this.value[i]) throw new TclError('unexpected text after }');

          // Everything is ok, add the current char to the string
          tempWord += read();
        }
      }

      // Check if there was actually data read
      if (this.value[i] || tempWord !== '') {
        // Only set the current item to the tempWord when it is still empty
        this.value[i] = this.value[i] || new TclSimple(tempWord);

        // Increment the item index because we had data
        i++;
      }

      // Move to the next char and word, regardless if the index has incremented
      read();
    }
  }

  /**
   * Function to set an item in the list to a value
   *
   * @param  {number} index - The index in the list you want to set to the value
   * @param  {TclSimple} value? - The value you want to add, if this empty the item will be removed
   * @returns TclSimple - The value you sent via the value argument
   */
  public set(index: number, value?: TclSimple): TclSimple | undefined {
    // If the value is nonexitant we want to delete the item
    if (!value) {
      // We cannot delete an item that does not exist
      if (!this.value[index])
        throw new TclError('cannot delete list item, item does not exist');

      // Remove the item from the array
      this.value.splice(index, 1);
    } else {
      // If we dont want to delete we just set the value
      this.value[index] = value;
    }
    return value;
  }

  /**
   * Delete a value from the list
   *
   * @param  {number} index
   * @returns void
   */
  public unset(index: number): void {
    // Use the set function to delete
    this.set(index);
  }

  /**
   * Get the string value of the list, this is made by joining the values with a space
   *
   * @returns string - The joined array
   */
  public getValue(): string {
    return this.value.map((val: TclSimple) => val.getValue()).join(' ');
  }

  /**
   * This function is used to recursively retrieve items from a list, every argument is one list deeper
   *
   * @param  {Array<number>} ...args - The indexes of the lists
   * @returns TclSimple - The eventually retrieved value
   */
  public getSubValue(...args: Array<number>): TclSimple {
    // There are no arguments, so just return a TclSimple with the current value
    if (args.length === 0)
      return new TclSimple(this.getValue(), this.getName());

    // There is only one argument, so if available return the value at that index
    if (args.length === 1) {
      if (this.value[args[0]]) return this.value[args[0]];
      // If not return an empty TclSimple, according to the tcl wiki
      else return new TclSimple('');
    }

    // Code reaches here when there are more than 1 arguments

    // Create a variable for keeping the current list
    let tempList: TclList | undefined = this;

    // Create a variable for keeping the eventual return value
    let out: TclSimple | undefined;

    // Loop over the received arguments
    for (let arg of args) {
      // Throw an error when there is no list available
      if (!tempList) throw new TclError('item is no list');

      // Retrieve the value from the list at the current index=arg and assign this to the output
      out = tempList.getSubValue(arg);

      // If the output is a TclSimple we create a list out of it and assign that to the tempList
      if (out instanceof TclSimple) tempList = out.getList();
      // If not tempList will be undefined
      else tempList = undefined;
    }

    // Throw an error when there is still no return value
    if (!out) throw new TclError('no such element in array');
    return out;
  }

  /**
   * Get the length of the list
   *
   * @returns number
   */
  public getLength(): number {
    return this.value.length;
  }
}

export class TclSimple extends TclVariable {
  //protected value: string = '';

  /**
   * Construct a TclSimple object, this contains a string with an unnecessary name
   *
   * @param  {string} value - The initial value
   * @param  {string} name? - Variable name
   */
  constructor(value: string, name?: string) {
    super(value, name);
  }

  /**
   * A function to create a list from a TclSimple object
   *
   * @returns TclList - The created list
   */
  public getList(): TclList {
    let list = new TclList(this.value, this.getName());
    return list;
  }

  /**
   * Function to convert the TclSimple to a js number if the value allows this
   *
   * @param  {boolean=false} isInt - Tell the function to return an int or a float
   * @returns number - The returned number
   */
  public getNumber(isInt: boolean = false): number | undefined {
    if (this.isNumber())
      return isInt ? parseInt(this.value, 10) : parseFloat(this.value);
    else return undefined;
  }

  /**
   * Check if this TclSimple can be converted to a number
   *
   * @returns boolean
   */
  public isNumber(): boolean {
    return Is.Number(this.value);
  }
}

export class TclObject extends TclVariable {
  /**
   * Initialize the tclobject and set the value to an empty object if none is parsed
   *
   * @param  {TclVariableHolder} value?
   * @param  {string} name?
   */
  constructor(value?: TclVariableHolder, name?: string) {
    super(value, name);
    if (!this.value) this.value = {};
  }

  /**
   * Function to set a value at a object key
   *
   * @param  {string} name
   * @param  {TclVariable} value?
   * @returns TclVariable - The value parsed
   */
  public set(name: string, value?: TclVariable): TclVariable | undefined {
    // Throw error when name is ''
    if (name === '') throw new TclError('invalid object key');

    // If value is empty delete value from the internal object
    if (!value) delete this.value[name];
    // If there is data append it to the correct key
    else this.value[name] = value;
    return value;
  }

  /**
   * Remove a key from the object
   *
   * @param  {string} name - The key you want to remove
   * @returns void
   */
  public unset(name: string): void {
    this.set(name);
  }

  /**
   * You are not meant to directly get the value of an object, so throw an error
   *
   * @returns string
   */
  public getValue(): string {
    throw new TclError(`can't read "${this.getName()}": variable is object`);
  }

  /**
   * Get a value from a specified key in the object
   *
   * @param  {string} name - The key you want the value from
   * @returns TclVariable - The value
   */
  public getSubValue(name: string): TclVariable {
    // Return this value when no name is specified
    if (name === '') return new TclSimple(this.getValue(), this.getName());

    // Throw error when key does not exist
    if (!this.value[name]) throw new TclError('no value found at given key');
    return this.value[name];
  }

  /**
   * Get the size of the object
   *
   * @returns number - Size
   */
  public getSize(): number {
    return Object.keys(this.value).length;
  }
}

export class TclArray extends TclVariable {
  /**
   * Construct a new TclArray and set the value to an empty array if it is not set
   *
   * @param  {Array<TclVariable>} value?
   * @param  {string} name?
   */
  public constructor(value?: Array<TclVariable>, name?: string) {
    super(value, name);
    if (!this.value) this.value = [];
  }

  /**
   * Set a value to a specified index in the array and return the value
   *
   * @param  {number} index - The index you want the value to be set at
   * @param  {TclVariable} value? - The value you want to set, leave empty to remove the index
   * @returns TclVariable - The value specified
   */
  public set(index: number, value?: TclVariable): TclVariable | undefined {
    // If the value is nonexitant we want to delete the item
    if (!value) {
      // We cannot delete an item that does not exist
      if (!this.value[index])
        throw new TclError('cannot delete array item, item does not exist');

      // Remove the item from the array
      this.value.splice(index, 1);
    } else {
      // If we dont want to delete we just set the value
      this.value[index] = value;
    }
    return value;
  }
  /**
   * Remove an index from the array
   *
   * @param  {number} index
   * @returns void
   */
  public unset(index: number): void {
    // Use the set function to remove the index
    this.set(index);
  }

  /**
   * You are not meant to directly get the value of an array, so throw an error
   *
   * @returns string
   */
  public getValue(): string {
    throw new TclError(`can't read "${this.getName()}": variable is array`);
  }

  /**
   * Get the value at a specified index
   *
   * @param  {number} index - The index you want the value from
   * @returns TclVariable - The found value
   */
  public getSubValue(index: number): TclVariable {
    // If index is not correct return the value of this variable
    if (index === undefined || index === null)
      return new TclSimple(this.getValue(), this.getName());

    // Throw error if index does not exist
    if (!this.value[index]) throw new TclError('no value found at given index');
    return this.value[index];
  }

  /**
   * Get the length of the array
   *
   * @returns number
   */
  public getLength(): number {
    return this.value.length;
  }
}

// A simple interface for an object that stores TclVariables with a string index
export interface TclVariableHolder {
  [index: string]: TclVariable;
}

// A simple interface for an object that holds tcl procs by a string index
export interface TclProcHolder {
  [index: string]: TclProc;
}

export type TclProcFunction =
  | ((
      interpreter: Interpreter,
      args: Array<string>,
      varArgs: Array<TclVariable>,
    ) => string)
  | ((
      interpreter: Interpreter,
      args: Array<string>,
      varArgs: Array<TclVariable>,
    ) => Promise<string>);

export class TclProc {
  name: string;
  callback: TclProcFunction;

  /**
   * The constructor to assign the name and callback
   *
   * @param  {string} name
   * @param  {TclProcFunction} callback
   */
  constructor(name: string, callback: TclProcFunction) {
    this.name = name;
    this.callback = callback;
  }
}
