const Tcl = require('../dist/tcl');
const chai = require('chai');
const expect = chai.expect;

describe('Calculator', () => {
  it('should add two numbers together', async () => {
    const tcl = new Tcl.Tcl();
    expect((await tcl.run('expr 3')).getValue()).to.equal('3');
  });
});
