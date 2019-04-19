const { Tcl } = require('../');

let tcl = new Tcl();

let result = tcl.runFile('./test/error.tcl');

console.log("Result:", result);
