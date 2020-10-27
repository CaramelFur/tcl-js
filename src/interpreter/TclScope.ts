import { TclError } from '../TclError';
import { TclArrayVariable } from './variables/TclArrayVariable';
import { TclSimpleVariable } from './variables/TclSimpleVariable';
import { TclVariable } from './variables/TclVariable';

export class TclScope {
  private parent: TclScope | null = null;

  private variables: {
    [index: string]: TclVariable;
  } = {};

  public constructor(disableCommands?: string[], parent?: TclScope) {
    if (parent) this.parent = parent;
  }

  public getParent(levels = 1): TclScope | null {
    if (this.parent === null) return null;

    if (levels === 1) return this.parent;
    return this.parent.getParent(levels - 1);
  }

  public hasVariable(name: string): boolean {
    return Object.keys(this.variables).indexOf(name) >= 0;
  }

  public setVariable(
    name: string,
    index: string | null,
    variable: TclSimpleVariable,
  ): void {
    if (index === null) {
      if (this.hasVariable(name) && this.variables[name].isArray())
        throw new Error(
          `can't set "${compileVarName(name, index)}": variable is array`,
        );

      this.variables[name] = variable;
    } else {
      if (this.hasVariable(name)) {
        if (!this.variables[name].isArray())
          throw new Error(
            `can't set "${compileVarName(name, index)}": variable isn't array`,
          );
      } else {
        this.variables[name] = new TclArrayVariable();
      }

      (this.variables[name] as TclArrayVariable).setEntry(index, variable);
    }
  }

  public getVariable(
    name: string,
    index: string | null = null,
  ): TclSimpleVariable {
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

      return (variable as TclArrayVariable).getEntry(index);
    } else {
      if (variable.isArray())
        throw new TclError(
          `can't read "${compileVarName(name, index)}": variable is array`,
        );

      return variable as TclSimpleVariable;
    }
  }

  public unsetVariable(name: string, index: string | null = null): void {
    if (!this.hasVariable(name))
      throw new TclError(
        `can't unset "${compileVarName(name, index)}": no such variable`,
      );

    if (index !== null) {
      if (!this.variables[name].isArray())
        throw new TclError(
          `can't unset "${compileVarName(name, index)}": variable isn't array`,
        );

      if (!(this.variables[name] as TclArrayVariable).hasEntry(index))
        throw new TclError(
          `can't unset "${compileVarName(
            name,
            index,
          )}": no such element in array`,
        );

      (this.variables[name] as TclArrayVariable).unsetEntry(index);
    } else {
      delete this.variables[name];
    }
  }
}

export function compileVarName(name: string, index: string | null): string {
  return `${name}${index !== null ? `(${index})` : ''}`;
}
