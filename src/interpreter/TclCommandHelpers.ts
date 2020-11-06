import { TclError } from '../TclError';
import { TclCommandOptions } from './TclScope';

export interface TclCommandHelpers {
  wrongNumArgs: () => void;
}

const thrw = (message: string) => () => {
  throw new TclError(message);
}

export function createHelpers(options: TclCommandOptions): TclCommandHelpers {
  return {
    wrongNumArgs: thrw(`wrong # args: should be "${options.command} ${options.argsBase}"`)
  }
}