import { Tcl } from '../../src/tcl';

let tcl = new Tcl();

tcl
  .runFile('./test/dev/test.tcl')
  .then(console.log)
  .catch(console.error); /**/

/*tcl
  //.run('puts hi\\nhi')
  .run('set lst "zero one two {{three four} five} six"; puts [lindex $lst]')
  .then(console.log)
  .catch(console.error); /**/
