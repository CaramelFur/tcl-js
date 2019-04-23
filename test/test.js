const { Tcl } = require('../');

let tcl = new Tcl();

tcl.runFile('./test/backslash.tcl').then(console.log).catch(console.error);
