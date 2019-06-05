const { Tcl } = require('../../dist/tcl');
const { IO } = require('../../dist/io');
const { TclVariable, TclSimple } = require('../../dist/types');
const expect = require('chai').expect;

module.exports = () => {
  it('Fetch disabled commands', async () => {
    let tcl = new Tcl(['puts']);

    let test = tcl.getDisabledCommands();

    expect(test)
      .to.be.an('array')
      .that.includes('puts');
  });

  it('Fetch IO class', async () => {
    let tcl = new Tcl();

    let io = tcl.getIO();

    expect(io).to.be.an.instanceof(IO);
  });

  it('Add external function', async () => {
    let tcl = new Tcl();
    let toChange = 'one';

    tcl.addSimpleProcedure('testing', (one) => {
      toChange = one;
      return 'hello ' + one;
    });

    let out = await tcl.run('testing world');

    expect(out).to.be.an.instanceof(TclVariable);
    expect(out.getValue()).to.equal('hello world');
    expect(toChange).to.equal('world');
  });

  it('Add advanced external function', async () => {
    let tcl = new Tcl();
    let toChange = 'one';

    tcl.addAdvancedProcedure('testing', (interpreter, args, command, helpers) => {
      return new TclSimple('hello ' + args[0].getValue() + ' in ' + command.command);
    });

    let out = await tcl.run('testing world');

    expect(out).to.be.an.instanceof(TclVariable);
    expect(out.getValue()).to.equal('hello world in testing');
  });
};
