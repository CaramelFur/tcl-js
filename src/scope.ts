import { Value } from './value';

export class Scope {
  parent: Scope | null = null;
  members: {
    [index: string]: Value;
  } = {};

  constructor(parent?: Scope) {
    parent = parent;
  }

  pop(): Scope | null {
    return this.parent;
  }

  define(name: string, value: any):Scope {
    this.members[name] = new Value(name, value);
    return this;
  }

  resolve(name: string): Value {
    if (Object.prototype.hasOwnProperty.call(this.members, name)) {
      return this.members[name];
    } else if (this.parent !== null) {
      return this.parent.resolve(name);
    }
    throw new Error(`Can't read "${name}": no such variable`);
  }
}
