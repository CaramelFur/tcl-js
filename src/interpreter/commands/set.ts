import { TclCommandScope } from '../TclScope';
import { TclSimpleVariable } from '../variables/TclSimpleVariable';

export default function LoadSet(commandScope: TclCommandScope): void {
  commandScope.addProc(
    {
      command: 'set',
      argsBase: 'varName ?newValue?',
    },
    (interpreter, scope, args, helpers) => {
      if (!args[0]) helpers.wrongNumArgs();
      if (args[1]) {
        scope.setVariable(args[0].getValue(), null, args[1]);
        return args[1];
      } else {
        return scope.getVariable(args[0].getValue());
      }
    },
  );
}
