import {LoadFunctions} from './commands';
import { Interpreter } from '../interpreter';

export class CommandHandler {
  commands: { [index: string]: Function } = {};

  constructor() {
    for(let loadFunc of LoadFunctions){
      loadFunc(this);
    }
  }

  define(name: string, fn: Function): CommandHandler {
    this.commands[name] = fn;
    return this;
  }

  invoke(interpreter: Interpreter, cmd: string, args: Array<string>) {
    if (!Object.prototype.hasOwnProperty.call(this.commands, cmd)) {
      throw new Error(`invalid command name ${cmd}`);
    }
    return this.commands[cmd](interpreter, args);
  }
}
