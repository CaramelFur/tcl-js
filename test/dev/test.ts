import { Tcl } from '../../src/tcl';

let tcl = new Tcl();

/*tcl
  .runFile('./test/dev/deepvar.tcl')
  .then(console.log)
  .catch(console.error); /**/

tcl
  //.run('puts hi\\nhi')
  .run('set lst "zero one two {{three four} five} six"; puts [lindex $lst 3 0 1]')
  .then(console.log)
  .catch(console.error); /**/
