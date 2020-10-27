import { TclError } from '../TclError';
import { TclArrayVariable } from './variables/TclArrayVariable';
import { TclSimpleVariable } from './variables/TclSimpleVariable';
import { TclVariable } from './variables/TclVariable';

export class TclScope {
  private variables: {
    [index: string]: TclVariable;
  } = {};

  public constructor(disableCommands?: string[]) {}

  public hasVariable(name: string): boolean {
    return Object.keys(this.variables).indexOf(name) >= 0;
  }

  public getVariable(name: string, index: string | null = null): TclVariable {
    if (!this.hasVariable(name))
      throw new TclError(
        `can't read "${compileVarName(name, index)}": no such variable`,
      );

    const variable = this.variables[name];

    if (index !== null) {
      if (!variable.isArray())
        throw new TclError(
          `can't read "${compileVarName(name, index)}": variable isn't array`,
        );

      return variable as TclArrayVariable;
    } else {
      if (variable.isArray())
        throw new TclError(
          `can't read "${compileVarName(name, index)}": variable is array`,
        );

      return variable as TclSimpleVariable;
    }
  }
}

export function compileVarName(name: string, index: string | null): string {
  return `${name}${index !== null ? `(${index})` : ''}`;
}
