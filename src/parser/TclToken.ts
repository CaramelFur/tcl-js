/**
 * Main AST object containing the entire parsed script
 *
 * @export
 * @class TclScript
 */
export class TclScript {
  commands: Array<TclCommand | TclComment>;

  /**
   * Creates an instance of TclScript.
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

export class TclCommand {
  words: TclWord[];

  constructor(words: TclWord[]) {
    this.words = words;
  }

  prepend(value: TclWord) {
    this.words.unshift(value);
    return this;
  }
}

export class TclComment {
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export enum TclWordTypes {
  normal = 'normal',
  brace = 'brace',
}

export class TclWord {
  //parts: TclWordPart[];
  value: string;
  type: TclWordTypes;
  expand: boolean;

  constructor(
    //parts: TclWordPart[],
    value: string,
    type: TclWordTypes = TclWordTypes.normal,
    expand: boolean = false,
  ) {
    this.type = type;
    //this.parts = parts;
    this.value = value;
    this.expand = expand;
  }

  /*prepend(value: TclWordPart) {
    this.parts.unshift(value);
    return this;
  }*/

  setExpand(value: boolean) {
    this.expand = value;
    return this;
  }
}

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
