import { Tcl } from '../tcl';
import {LoadFunctions} from './commands';

export class CommandSet {
  interpreter: Tcl;
  commands: { [index: string]: Function } = {};

  constructor(interpreter: Tcl) {
    this.interpreter = interpreter;

    for(let loadFunc of LoadFunctions){
      loadFunc(this);
    }
  }

  define(name: string, fn: Function): CommandSet {
    this.commands[name] = fn;
    return this;
  }

  invoke(cmd: string, args: Array<string>) {
    if (!Object.prototype.hasOwnProperty.call(this.commands, cmd)) {
      throw new Error(`invalid command name ${cmd}`);
    }
    return this.commands[cmd](this.interpreter, args);
  }
}
