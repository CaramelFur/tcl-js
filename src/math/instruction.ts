export enum InstructionTypes {
  INUMBER = 'INUMBER',
  IOP1 = 'IOP1',
  IOP2 = 'IOP2',
  IOP3 = 'IOP3',
  IVAR = 'IVAR',
  IFUNCALL = 'IFUNCALL',
  IEXPR = 'IEXPR',
  IMEMBER = 'IMEMBER',
}

export class Instruction {
  public type: InstructionTypes;
  public value: number | boolean | string | Instruction[];

  public constructor(
    type: InstructionTypes,
    value: number | boolean | string | Instruction[],
  ) {
    this.type = type;
    this.value = value !== undefined && value !== null ? value : 0;
  }

  public toString() {
    switch (this.type) {
      case InstructionTypes.INUMBER:
      case InstructionTypes.IOP1:
      case InstructionTypes.IOP2:
      case InstructionTypes.IOP3:
      case InstructionTypes.IVAR:
        return this.value;
      case InstructionTypes.IFUNCALL:
        return 'CALL ' + this.value;
      case InstructionTypes.IMEMBER:
        return '.' + this.value;
      default:
        return 'Invalid Instruction';
    }
  }
}

export function unaryInstruction(value: string) {
  return new Instruction(InstructionTypes.IOP1, value);
}

export function binaryInstruction(value: string) {
  return new Instruction(InstructionTypes.IOP2, value);
}

export function ternaryInstruction(value: string) {
  return new Instruction(InstructionTypes.IOP3, value);
}
