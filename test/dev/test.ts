import { Tcl } from '../../src/tcl';

let tcl = new Tcl();

/*tcl
  .runFile('./test/dev/deepvar.tcl')
  .then(console.log)
  .catch(console.error); /**/

tcl
  //.run('puts hi\\nhi')
  .run('expr {bnot 4}')
  .then(console.log)
  .catch(console.error); /**/
