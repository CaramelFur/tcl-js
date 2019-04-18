import {
  TclVariableHolder,
  TclVariable,
  TclObject,
  TclArray,
  TclSimple,
  TclProc,
  TclProcHolder,
} from './types';
import { LoadFunctions } from './commands';
import { TclError } from './tclerror';

const variableRegex = /(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/;

export class Scope {
  parent: Scope | null = null;
  members: TclVariableHolder = {};
  procedures: TclProcHolder = {};

  constructor(parent?: Scope) {
    if (parent) this.parent = parent;
    else {
      for (let loadFunc of LoadFunctions) {
        loadFunc(this);
      }
    }
  }

  pop(): Scope | null {
    return this.parent;
  }

  define(inputName: string, inputValue: string): Scope {
    let regex = variableRegex.exec(inputName);
    if (!regex || !regex.groups)
      throw new TclError(`Can't read "${inputName}": invalid variable name`);

    let name = regex.groups.name;

    let input = new TclSimple(inputValue, name);

    let value: TclVariable | undefined = this._resolve(name);

    if (regex.groups.object) {
      let obj: TclObject | undefined =
        value instanceof TclObject ? value : undefined;

      if (!obj) obj = new TclObject(undefined, name);

      obj.set(regex.groups.object, input);

      value = obj;
    } else if (regex.groups.array) {
      let arr: TclArray | undefined =
        value instanceof TclArray ? value : undefined;

      if (!arr) arr = new TclArray(undefined, name);

      let arrayNum = parseInt(regex.groups.array, 10);
      arr.set(arrayNum, input);

      value = arr;
    } else {
      value = input;
    }

    this.members[name] = value;
    return this;
  }

  undefine(name: string, nocomplain?: boolean): any {
    if (
      !Object.prototype.hasOwnProperty.call(this.members, name) &&
      !nocomplain
    )
      throw new TclError(`Can't delete "${name}": no such variable`);
    let returnValue = this.members[name];
    delete this.members[name];
    return returnValue;
  }

  _resolve(name: string): TclVariable | undefined {
    if (Object.prototype.hasOwnProperty.call(this.members, name)) {
      return this.members[name];
    } else if (this.parent !== null) {
      return this.parent._resolve(name);
    }
  }

  resolve(inputName: string): TclVariable {
    let regex = variableRegex.exec(inputName);
    if (!regex || !regex.groups)
      throw new TclError(`Can't read "${inputName}": invalid variable name`);

    let name = regex.groups.name;

    let testValue: TclVariable | undefined;

    if (Object.prototype.hasOwnProperty.call(this.members, name)) {
      testValue = this.members[name];
    } else if (this.parent !== null) {
      testValue = this.parent.resolve(name);
    }

    if (!testValue) throw new TclError(`Can't read "${name}": no such variable`);

    let value: TclVariable = testValue;

    if (regex.groups.object) {
      if (!(value instanceof TclObject))
        throw new TclError(`Can't read "${name}": variable is no object`);
      return value.getSubValue(regex.groups.object);
    } else if (regex.groups.array) {
      if (!(value instanceof TclArray))
        throw new TclError(`Can't read "${name}": variable is no array`);
      let arrayNum = parseInt(regex.groups.array, 10);
      return value.getSubValue(arrayNum);
    } else {
      return value;
    }
  }

  defineProc(name: string, callback: Function) {
    this.procedures[name] = new TclProc(name, callback);
  }

  disableProc(name: string) {
    if (Object.prototype.hasOwnProperty.call(this.procedures, name)) {
      delete this.procedures[name];
    }else{
      throw new TclError(`Can't disable "${name}": no such function`)
    }
  }

  resolveProc(name: string): TclProc {
    if (Object.prototype.hasOwnProperty.call(this.procedures, name)) {
      return this.procedures[name];
    } else if (this.parent !== null) {
      return this.parent.resolveProc(name);
    }
    throw new TclError(`invalid command name ${name}`);
  }
}
