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

  it('Delete setting', async () => {
    let scope = new Scope();
    
    scope.setSetting('test', true);

    expect(scope.getSetting('test')).to.equal(true);

    scope.setSetting('test', null);

    expect(scope.getSetting('test')).to.equal(null);
  });

  it('Delete subsetting', async () => {
    let scope = new Scope();
    
    scope.setSetting('test', true);

    expect(scope.getSetting('test')).to.equal(true);

    scope.setSubSetting('test', 'wow', true);

    expect(scope.getSetting('test')).to.eql({wow: true});

    scope.setSubSetting('test', 'wow', null);

    expect(scope.getSetting('test')).to.eql({});
  });

  it('Unexpected subsetting', async () => {
    let scope = new Scope();
  
    expect(scope.getSetting('test')).to.equal(null);

    let out = scope.setSubSetting('test', 'wow', true);

    expect(out).to.equal(false);
  });
};
