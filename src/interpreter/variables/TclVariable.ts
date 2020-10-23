export class TclVariable {
  private value: string;

  public constructor(value?: string) {
    this.value = value || '';
  }

  public toString() {
    return this.value;
  }
}
