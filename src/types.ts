import * as Is from './is';

export class TclVariable {
  protected value: any = '';
  protected name: string | undefined = undefined;

  constructor(value: any, name?: string) {
    this.value = value;
    if (name) this.name = name;
  }

  getValue(): string {
    return this.value;
  }

  getSubValue(key?: any): any {
    return undefined;
  }

  getRawValue(): any {
    return this.value;
  }

  getName(): string | undefined {
    return this.name;
  }

  getNumber(isInt?: boolean): number | undefined {
    return undefined;
  }

  isNumber(): boolean {
    return false;
  }
}

export class TclList extends TclVariable {
  //value: Array<TclSimple> = [];

  constructor(value: string, name?: string) {
    super([], name);
    this.destruct(value);
  }

  private destruct(input: string) {
    let idx = 0;
    let char = input.charAt(idx);

    function read() {
      let old = char;
      idx += 1;
      char = input.charAt(idx);
      return old;
    }

    function parseBrace(depth: number): string {
      let returnVar = '';
      read();
      while (depth > 0) {
        returnVar += read();
        if (char === '{') depth++;
        if (char === '}') depth--;
      }
      if (depth < 0) throw new Error('incorrect brackets in list');
      read();
      return returnVar;
    }

    let i = 0;
    while (idx < input.length) {
      let tempWord = '';
      while (!Is.WordSeparator(char) && idx < input.length) {
        if (char === '{') {
          if (tempWord !== '') throw new Error('unexpected {');
          this.value[i] = new TclSimple(parseBrace(1));
        } else {
          if (this.value[i]) throw new Error('unexpected text after }');
          tempWord += read();
        }
      }
      this.value[i] = this.value[i] || new TclSimple(tempWord);
      i++;
      read();
    }
  }

  set(index: number, value?: TclSimple) {
    if (!value) delete this.value[index];
    else this.value[index] = value;
    return value;
  }

  unset(index: number) {
    return this.set(index);
  }

  getValue(): string {
    return this.value.map((val: TclSimple) => val.getValue()).join(' ');
  }

  getSubValue(...args: Array<number>): TclSimple {
    if (args.length === 0)
      return new TclSimple(this.getValue(), this.getName());
    if (args.length === 1) {
      if (this.value[args[0]]) return this.value[args[0]];
      else return new TclSimple('');
    }

    let tempList: TclList | undefined = this;
    let out: TclSimple | undefined;
    for (let arg of args) {
      if (!tempList) throw new Error('item is no list');
      out = tempList.getSubValue(arg);
      if (out instanceof TclSimple) tempList = out.getList();
      else tempList = undefined;
    }
    if (!out) throw new Error('no such element in array');
    return out;
  }

  getLength(): number {
    return this.value.length;
  }
}

export class TclSimple extends TclVariable {
  //protected value: string = '';

  constructor(value: string, name?: string) {
    super(value, name);
  }

  getValue(): string {
    return this.value;
  }

  getList(): TclList {
    let list = new TclList(this.value, this.getName());
    return list;
  }

  getNumber(isInt: boolean = false): number | undefined {
    if (this.isNumber)
      return isInt ? parseInt(this.value, 10) : parseFloat(this.value);
    else return undefined;
  }

  isNumber(): boolean {
    return Is.Number(this.value);
  }
}

export interface TclVariableHolder {
  [index: string]: TclVariable;
}

export class TclObject extends TclVariable {
  //protected value: TclVariableHolder = {};

  constructor(value?: TclVariableHolder, name?: string) {
    super(value, name);
  }

  set(name: string, value?: TclVariable) {
    if (!name) throw new Error('invalid object key');
    if (!value) delete this.value[name];
    else this.value[name] = value;
    return value;
  }

  unset(name: string) {
    return this.set(name);
  }

  getValue(): string {
    return '[Object]';
  }

  getSubValue(name: string): TclVariable {
    if (!name) return new TclSimple('[Object]', this.getName());
    if (!this.value[name]) throw new Error('no value found at given key');
    return this.value[name];
  }

  getSize(): number {
    return Object.keys(this.value).length;
  }
}

export class TclArray extends TclVariable {
  //protected value: Array<TclVariable> = [];

  constructor(value?: Array<TclVariable>, name?: string) {
    super(value, name);
  }

  set(index: number, value?: TclVariable) {
    if (!value) delete this.value[index];
    else this.value[index] = value;
    return value;
  }

  unset(index: number) {
    return this.set(index);
  }

  getValue(): string {
    return '[Array]';
  }

  getSubValue(index: number): TclVariable {
    if (index === undefined || index === null)
      return new TclSimple('[Array]', this.getName());
    if (!this.value[index]) throw new Error('no value found at given index');
    return this.value[index];
  }

  getLength(): number {
    return this.value.length;
  }
}

export interface TclProcHolder {
  [index: string]: TclProc;
}

export class TclProc {
  name: string;
  callback: Function;

  constructor(name: string, callback: Function) {
    this.name = name;
    this.callback = callback;
  }
}
