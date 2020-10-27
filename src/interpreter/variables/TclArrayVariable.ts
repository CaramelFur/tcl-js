import { TclError } from '../../TclError';
import { compileVarName } from '../TclScope';
import { TclSimpleVariable } from './TclSimpleVariable';
import { TclVariable } from './TclVariable';

interface SimpleVariableEntryList {
  [index: string]: TclSimpleVariable;
}

export class TclArrayVariable extends TclVariable {
  private entries: SimpleVariableEntryList = {};

  constructor(initialValues?: SimpleVariableEntryList) {
    super();
    if (initialValues) this.entries = initialValues;
  }

  public hasEntry(name: string): boolean {
    return Object.keys(this.entries).indexOf(name) >= 0;
  }

  public getEntry(name: string): TclSimpleVariable {
    if (!this.hasEntry(name))
      throw new TclError(
        'Interpreter tried to access variable without verifying existence',
      );

    return this.entries[name];
  }

  public setEntry(name: string, value: TclSimpleVariable): boolean {
    const isNew = this.hasEntry(name);
    this.entries[name] = value;
    return isNew;
  }

  public unsetEntry(name: string): void {
    if (!this.hasEntry(name))
      throw new TclError(`Interpreter did not check if element existed`);

    delete this.entries[name];
  }

  public toString(): string {
    const entries = Object.keys(this.entries)
      .map((entry) => `${entry}: ${this.entries[entry].toString()}`)
      .join(',\n');
    return `TclArrayVariable(\n${entries}\n)`;
  }

  public isArray(): true {
    return true;
  }
}
