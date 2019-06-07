import { Tcl } from '../../src/tcl';

async function main() {
  let tcl = new Tcl();

  tcl.setVariable('test', {hello: 'world', there: 'gay'});

  let out = await tcl.runFile('./test/dev/test.tcl');
  console.log(out);

  console.log(tcl.getVariable('vstring'));
  console.log(tcl.getVariable('vnumber'));
  console.log(tcl.getVariable('vboolean'));

  console.log(tcl.getVariable('varr'));

  console.log(tcl.getVariable('vobj'));
}

main().catch(console.error);

/*tcl
  //.run('puts hi\\nhi')
  .run('set lst "zero one two {{three four} five} six"; puts [lindex $lst]')
  .then(console.log)
  .catch(console.error); /**/
