export type AnyWordPart = TextPart | EscapePart | CodePart | VariablePart;

export class TextPart {
  value: string;
  constructor(value: string) {
    this.value = value;
  }
}

export enum EscapePartType {
  normal = 'normal',
  octal = 'octal',
  hex = 'hex',
  hex16 = 'hex16',
  hex32 = 'hex32',
}

export class EscapePart {
  backslashValue: string;
  type: EscapePartType;

  constructor(unparsed: string) {
    const clean = unparsed.slice(1);
    switch (clean[0]) {
      case 'x':
        this.type = EscapePartType.hex;
        this.backslashValue = clean.slice(1);
        break;
      case 'u':
        this.type = EscapePartType.hex16;
        this.backslashValue = clean.slice(1);
        break;
      case 'U':
        this.type = EscapePartType.hex32;
        this.backslashValue = clean.slice(1);
        break;
      default: {
        const cint = parseInt(clean[0], 10);
        if (cint >= 0 && cint <= 7) {
          this.type = EscapePartType.octal;
          this.backslashValue = clean;
        } else {
          this.type = EscapePartType.normal;
          this.backslashValue = clean;
        }
      }
    }
  }
}

export class CodePart {
  value: string;
  constructor(value: string) {
    this.value = value;
  }
}

export class VariablePart {
  name: string;
  index: AnyWordPart[] | null;
  constructor(name: string, index: AnyWordPart[] | null = null) {
    this.name = name;
    this.index = index;
  }
}
