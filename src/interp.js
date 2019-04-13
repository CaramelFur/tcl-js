const CoreInterp = require('./coreinterp');
const ex_core_cmds = require('./ex_core_cmds');

function Interp(...argums) {
	let args = argums.slice();
	let I = new CoreInterp();

	ex_core_cmds.install(I);
	for (let i = 0; i < args.length; i++) {
		args[i].install(I);
	}
	
	return I;
};

module.exports = Interp;
