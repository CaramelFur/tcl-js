const { Tcl } = require('../');

let tcl = new Tcl();

tcl.runFile('./test/simple.tcl').then(console.log).catch(console.error);
