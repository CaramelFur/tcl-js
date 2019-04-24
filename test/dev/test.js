const { Tcl } = require('../../dist/tcl');

let tcl = new Tcl();

tcl.runFile('./test/dev/simple.tcl').then(console.log).catch(console.error);
