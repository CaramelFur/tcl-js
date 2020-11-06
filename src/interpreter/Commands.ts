import LoadSet from './commands/set';
import { TclCommandScope, TclScope } from './TclScope';

const BuiltInCommands: Array<(scope: TclCommandScope) => void> = [LoadSet];

export function LoadCommands(scope: TclCommandScope): void {
  for (const builtInCommand of BuiltInCommands) {
    builtInCommand(scope);
  }
}
