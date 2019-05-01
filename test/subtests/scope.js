const Tcl = require('../../dist/tcl');
const expect = require('chai').expect;

module.exports = () => {
  it('Undefine function', async () => {
    let tcl = new Tcl.Tcl(['puts']);
    let err = {
      name: '',
    };
    try {
      await tcl.run('puts hello');
    } catch (e) {
      err = e;
    }
    if (!err) throw new Error();
    expect(err.name).to.equal('TclError');
  });
};
