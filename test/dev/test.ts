import { Tcl } from '../../src/tcl';

let tcl = new Tcl();

/*tcl
  .runFile('./test/dev/deepvar.tcl')
  .then(console.log)
  .catch(console.error); /**/

tcl
  //.run('puts hi\\nhi')
  .run('set test [puts [puts hi\\nhi]]   ')
  .then(console.log)
  .catch(console.error); /**/
