const Tcl = require('../../dist/tcl');
const Scope = require('../../dist/scope').Scope;
const Types = require('../../dist/types');
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

  it('Undefine in parent', async () => {
    let scope = new Scope();
    scope.define('hi', new Types.TclSimple('hello'));

    let test = scope.resolve('hi');
    expect(test instanceof Types.TclSimple).to.equal(true);
    expect(test.getValue()).to.equal('hello');

    let subscope = new Scope(scope);
    test = subscope.resolve('hi');
    expect(test instanceof Types.TclSimple).to.equal(true);
    expect(test.getValue()).to.equal('hello');

    subscope.undefine('hi');

    test = scope.resolve('hi');
    expect(test).to.equal(null);
  });

  it('Disable non-existing proc', async () => {
    let scope = new Scope();
    try {
      scope.disableProc('nope');
    } catch (e) {
      expect(e.name).to.equal('TclError');
      expect(e.message).to.equal('can\'t disable "nope": no such function');
    }
  });
};
