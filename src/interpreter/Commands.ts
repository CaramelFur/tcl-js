import LoadSet from './commands/set';
import { TclScope } from './TclScope';

const BuiltInCommands: Array<(scope: TclScope) => void> = [LoadSet];

export function LoadCommands(scope: TclScope): void {
  for (const builtInCommand of BuiltInCommands) {
    builtInCommand(scope);
  }
}
