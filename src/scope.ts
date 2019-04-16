interface ValuesObject {
  [index: string]: Value;
}

const variableRegex = /(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/;

export class Scope {
  parent: Scope | null = null;
  members: ValuesObject = {};

  constructor(parent?: Scope) {
    parent = parent;
  }

  pop(): Scope | null {
    return this.parent;
  }

  define(inputName: string, inputValue: any): Scope {
    let regex = variableRegex.exec(inputName);
    if (!regex || !regex.groups)
      throw new Error(`Can't read "${inputName}": invalid variable name`);

    let name = regex.groups.name;

    let value: any;

    if (Object.prototype.hasOwnProperty.call(this.members, name)) {
      value = this.members[name].value;
    } else if (this.parent !== null) {
      value = this.parent.resolve(name).value;
    }

    if (regex.groups.object) {
      if (!value) value = {};
      value[regex.groups.object] = inputValue;
    } else if (regex.groups.array) {
      if (!value) value = [];
      let arrayNum = parseInt(regex.groups.array, 10);
      value[arrayNum] = inputValue;
    } else {
      value = inputValue;
    }

    this.members[name] = new Value(name, value);
    return this;
  }

  undefine(name: string, nocomplain?: boolean): any {
    if (
      !Object.prototype.hasOwnProperty.call(this.members, name) &&
      !nocomplain
    )
      throw new Error(`Can't delete "${name}": no such variable`);
    let returnValue = this.members[name];
    delete this.members[name];
    return returnValue;
  }

  resolve(inputName: string): any {
    let regex = variableRegex.exec(inputName);
    if (!regex || !regex.groups)
      throw new Error(`Can't read "${inputName}": invalid variable name`);

    let name = regex.groups.name;

    let value: any;

    if (Object.prototype.hasOwnProperty.call(this.members, name)) {
      value = this.members[name].value;
    } else if (this.parent !== null) {
      value = this.parent.resolve(name).value;
    }

    if (!value) throw new Error(`Can't read "${name}": no such variable`);

    if (regex.groups.object) {
      if (typeof value !== 'object')
        throw new Error(`Can't read "${name}": variable is no object`);
      return value[regex.groups.object];
    } else if (regex.groups.array) {
      if (!Array.isArray(value))
        throw new Error(`Can't read "${name}": variable is no array`);
      let arrayNum = parseInt(regex.groups.array, 10);
      return value[arrayNum];
    } else {
      return value;
    }
  }
}

export class Value {
  name: string;
  value: any;

  constructor(name: string, value: any) {
    this.name = name;
    this.value = value;
  }
}
