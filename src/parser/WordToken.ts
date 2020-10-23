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

  constructor(value: string, type: EscapePartType = EscapePartType.normal) {
    this.backslashValue = value;
    this.type = type;
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
