import { ParseList } from '../../parser';
import { TclVariable } from './TclVariable';

export class TclSimpleVariable extends TclVariable {
  private value: string;

  constructor(value = '') {
    super();
    this.value = value;
  }

  public setValue(value: string): void {
    this.value = value;
  }

  public getValue(): string {
    return this.value;
  }

  public toList(): string[] {
    return ParseList(this.value);
  }

  public toString(): string {
    return `TclSimpleVariable("${this.value}")`;
  }

  public isArray(): false {
    return false;
  }
}
