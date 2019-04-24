const { Tcl } = require('../../dist/tcl');

let tcl = new Tcl();

tcl.runFile('./test/scripts/substitution.tcl').then(console.log).catch(console.error);
