import { Tcl } from '../../src/tcl';

let tcl = new Tcl();

/*tcl
  .runFile('./test/dev/deepvar.tcl')
  .then(console.log)
  .catch(console.error); /**/

tcl
  .run('set var(1) HelloWorld; puts $var;')
  .then(console.log)
  .catch(console.error); /**/
