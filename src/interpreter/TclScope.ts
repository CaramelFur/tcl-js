import { TclError } from '../TclError';
import { LoadCommands } from './Commands';
import { createHelpers, TclCommandHelpers } from './TclCommandHelpers';
import { TclInterpreter } from './TclInterpreter';
import { TclArrayVariable } from './variables/TclArrayVariable';
import { TclSimpleVariable } from './variables/TclSimpleVariable';
import { TclVariable } from './variables/TclVariable';

export type TclFullCommandHandler = (
  interpreter: TclInterpreter,
  scope: TclScope,
  args: TclSimpleVariable[],
  helpers: TclCommandHelpers,
) => TclSimpleVariable | void;

export type TclCommandHandler = (
  interpreter: TclInterpreter,
  scope: TclScope,
  args: TclSimpleVariable[],
) => TclSimpleVariable | void;

export interface TclCommandOptions {
  command: string;
  argsBase: string;
}

export interface TclCommand {
  handler: TclCommandHandler;
  options: TclCommandOptions;
}

export class TclCommandScope {
  private procs: {
    [index: string]: TclCommand;
  } = {};

  public constructor(disableCommands: string[]) {
    LoadCommands(this);

    for (const disabledCommand of disableCommands) {
      if (this.hasProc(disabledCommand)) {
        this.deleteProc(disabledCommand);
      }
    }
  }

  // Procs

  public hasProc(command: string): boolean {
    return Object.keys(this.procs).indexOf(command) >= 0;
  }

  public getProc(command: string): TclCommand {
    if (!this.hasProc(command)) {
      throw new TclError(`invalid command name "${command}"`);
    }

    return this.procs[command];
  }

  public addProc(
    options: TclCommandOptions,
    fullHandler: TclFullCommandHandler,
  ): boolean {
    if (this.hasProc(options.command)) return false;

    const helpers = createHelpers(options);
    const handler: TclCommandHandler = (interpreter, scope, args) => fullHandler(interpreter, scope, args, helpers)

    this.procs[options.command] = {
      handler,
      options,
    };

    return true;
  }

  private deleteProc(command: string) {
    delete this.procs[command];
  }
}

export class TclScope {
  private parent: TclScope | null = null;
  private commandScope: TclCommandScope;

  private variables: {
    [index: string]: TclVariable;
  } = {};

  public constructor(disableCommands?: string[], parent?: TclScope) {
    if (parent) {
      this.parent = parent;
      this.commandScope = parent.getCommandScope();
    } else {
      this.commandScope = new TclCommandScope(disableCommands || []);
    }
  }

  public getCommandScope(): TclCommandScope {
    return this.commandScope;
  }

  public getParent(levels = 1, fail = true): TclScope | null {
    if (this.parent === null) return fail ? null : this;

    if (levels === 1) return this.parent;
    return this.parent.getParent(levels - 1);
  }

  // Variables

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
