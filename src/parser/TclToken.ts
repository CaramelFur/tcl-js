/**
 * Main AST object containing the entire parsed script
 *
 * @export
 * @class TclScript
 */
export class TclScript {
  /**
   * An array containing all commands and comments of this script
   *
   * @type {(Array<TclCommand | TclComment>)}
   * @memberof TclScript
   */
  commands: Array<TclCommand | TclComment>;

  /**
   * Creates an instance of TclScript
   *
   * @param {(Array<TclCommand | TclComment>)} commands
   * @memberof TclScript
   */
  constructor(commands: Array<TclCommand | TclComment>) {
    this.commands = commands;
  }

  /**
   * Prepends a command to the list of commands in this object
   *
   * @param {(TclCommand | TclComment)} value
   * @returns
   * @memberof TclScript
   */
  prepend(value: TclCommand | TclComment) {
    this.commands.unshift(value);
    return this;
  }
}

/**
 * Ast object that contains a tcl command
 *
 * @export
 * @class TclCommand
 */
export class TclCommand {
  /**
   * An array that contains all words of this command
   *
   * @type {TclWord[]}
   * @memberof TclCommand
   */
  words: TclWord[];

  /**
   * Creates an instance of TclCommand
   *
   * @param {TclWord[]} words
   * @memberof TclCommand
   */
  constructor(words: TclWord[]) {
    this.words = words;
  }

  /**
   * This will prepend a new word to the beginning of the command
   *
   * @param {TclWord} value
   * @returns
   * @memberof TclCommand
   */
  prepend(value: TclWord) {
    this.words.unshift(value);
    return this;
  }
}

/**
 * Ast object containing a user comment
 *
 * @export
 * @class TclComment
 */
export class TclComment {
  /**
   * The string that holds the text of the user made comment
   *
   * @type {string}
   * @memberof TclComment
   */
  value: string;

  /**
   * Creates an instance of TclComment
   *
   * @param {string} value
   * @memberof TclComment
   */
  constructor(value: string) {
    this.value = value;
  }
}

/**
 * This lists all possible wordtypes, tcl has 2 major ones, braced and non-braced
 * Braced words don't have substitutions while normal words do
 *
 * @export
 * @enum {number}
 */
export enum TclWordTypes {
  normal = 'normal',
  brace = 'brace',
}

/**
 * Ast object containg a word of a command
 *
 * @export
 * @class TclWord
 */
export class TclWord {
  //parts: TclWordPart[];

  /**
   * The text of the word
   *
   * @type {string}
   * @memberof TclWord
   */
  value: string;

  /**
   * The word type
   *
   * @type {TclWordTypes}
   * @memberof TclWord
   */
  type: TclWordTypes;

  /**
   * This tells the interpreter if this word should be expanded from a list to seperate word
   *
   * @type {boolean}
   * @memberof TclWord
   */
  expand: boolean;

  /**
   * Creates an instance of TclWord
   *
   * @param {string} value
   * @param {TclWordTypes} [type=TclWordTypes.normal]
   * @param {boolean} [expand=false]
   * @memberof TclWord
   */
  constructor(
    value: string,
    type: TclWordTypes = TclWordTypes.normal,
    expand: boolean = false,
  ) {
    this.type = type;
    //this.parts = parts;
    this.value = value;
    this.expand = expand;
  }

  /**
   * This changes the expand value,
   * this value tells the interpreter if this word should be expanded from a list to seperate word
   *
   * @param {boolean} value
   * @returns
   * @memberof TclWord
   */
  setExpand(value: boolean) {
    this.expand = value;
    return this;
  }

  /*prepend(value: TclWordPart) {
    this.parts.unshift(value);
    return this;
  }*/
}

/*
Currently obsolete, but here incase i need them

export enum TclWordPartTypes {
  string = 'string',
  //variable = "variable",
  //bracket = "bracket",
}

export class TclWordPart {
  type: TclWordPartTypes;
  value: string;
  //value: string | TclVariable;
  //substituted: boolean = false;

  constructor(value: string, type: TclWordPartTypes = TclWordPartTypes.string) {
    this.type = type;
    this.value = value;
  }
}

export interface TclVariable {
  name: string;
  subname: string | null;
}
*/
