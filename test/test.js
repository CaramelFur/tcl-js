const { Tcl } = require('../');

let tcl = new Tcl();

let result = tcl.runFile('./test/simple.tcl');

console.log("Result:", result);
