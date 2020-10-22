import { TclOptions } from '../tcl';

export class TclInterpreter {
  private options: TclOptions;

  constructor(options: TclOptions) {
    this.options = options;
  }
}
