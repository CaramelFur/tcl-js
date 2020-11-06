import { TclCommandScope } from '../TclScope';
import { TclSimpleVariable } from '../variables/TclSimpleVariable';

export default function LoadSet(scope: TclCommandScope): void {
  scope.addProc(
    {
      command: 'set',
    },
    (interpreter, scope, args) => {
      console.log(args);
      return new TclSimpleVariable("test");
    },
  );
}
