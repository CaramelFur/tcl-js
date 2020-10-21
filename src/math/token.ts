export enum TokenTypes {
  TEOF = 'TEOF',
  TOP = 'TOP',
  TNUMBER = 'TNUMBER',
  TSTRING = 'TSTRING',
  TPAREN = 'TPAREN',
  TCOMMA = 'TCOMMA',
  TNAME = 'TNAME',
}

export class Token {
  public type: TokenTypes;
  public value: string;
  public index: number;

  public constructor(type: TokenTypes, value: string, index: number) {
    this.type = type;
    this.value = value;
    this.index = index;
  }

  public toString() {
    return this.type + ': ' + this.value;
  }
}
