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
  prepend(value: TclCommand | TclComment): TclScript {
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

  line: number;
  col: number;

  constructor(words: TclWord[], line: number, col: number) {
    this.words = words;
    this.line = line;
    this.col = col;
  }

  /**
   * This will prepend a new word to the beginning of the command
   *
   * @param {TclWord} value
   * @returns
   * @memberof TclCommand
   */
  prepend(value: TclWord): TclCommand {
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
  line: number;
  col: number;

  constructor(value: string, line: number, col: number) {
    this.value = value;
    this.line = line;
    this.col = col;
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

  line: number;
  col: number;

  constructor(
    value: string,
    line: number,
    col: number,
    type: TclWordTypes = TclWordTypes.normal,
    expand = false,
  ) {
    this.type = type;
    //this.parts = parts;
    this.value = value;
    this.expand = expand;
    this.line = line;
    this.col = col;
  }

  setExpand(value: boolean, line: number, col: number): TclWord {
    this.expand = value;
    this.line = line;
    this.col = col;
    return this;
  }
}
