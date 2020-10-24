export class TclVariable {
  private value: string;

  public constructor(value?: string) {
    this.value = value || '';
  }

  public toString(): string {
    return this.value;
  }

  public toStringList(): string[] {
    return [];
  }

  public toVarList(): TclVariable[] {
    return [];
  }
}
