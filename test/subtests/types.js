const Types = require('../../dist/types');
const TclError = require('../../dist/tclerror').TclError;
const expect = require('chai').expect;

module.exports = () => {
  // TclSimple
  it('Valid number', async () => {
    let test = new Types.TclSimple('35');
    test = test.getNumber();
    expect(test).to.equal(35);
  });

  it('Valid decimal number', async () => {
    let test = new Types.TclSimple('35.13');
    test = test.getNumber();
    expect(test).to.equal(35.13);
  });

  it('Invalid number', async () => {
    let test = new Types.TclSimple('Hello there');
    test = test.getNumber();
    expect(test).to.equal(0);
  });

  it('Invalid number but has number', async () => {
    let test = new Types.TclSimple('Hello there 420');
    test = test.getNumber();
    expect(test).to.equal(0);
  });

  // TclObject
  it('Filled constructor object', async () => {
    let obj = new Types.TclObject({
      hi: new Types.TclSimple('hello'),
    });
    let test = obj.getSize();
    expect(test).to.equal(1);

    test = obj.getSubValue('hi');
    expect(test instanceof Types.TclSimple).to.equal(true);
    expect(test.getValue()).to.equal('hello');
  });

  it('Filled constructor array', async () => {
    let test = new Types.TclArray();
    test = test.getLength();
    expect(test).to.equal(0);
  });

  it('Get empty object key', async () => {
    let test = new Types.TclObject();
    try {
      test = test.getSubValue();
    } catch (e) {
      expect(e.name).to.equal('TclError');
    }
  });

  it('Construct proc 1', async () => {
    let test = new Types.TclProc('test', () => {}, {});
    expect(test instanceof Types.TclProc).to.equal(true);
  });

  it('Construct proc 2', async () => {
    let test = new Types.TclProc('test', () => {}, { arguments: {} });
    expect(test instanceof Types.TclProc).to.equal(true);
  });

  it('Construct Error', async () => {
    let test = new TclError();
    expect(test instanceof Error).to.equal(true);
    expect(test.name).to.equal('TclError');
  });

  it('Get number from boolean', async () => {
    let test = new Types.TclSimple('true');
    test = test.getNumber();
    expect(test).to.equal(1);
  });

  it('Get number from boolean false', async () => {
    let test = new Types.TclSimple('off');
    test = test.getNumber();
    expect(test).to.equal(0);
  });

  it('Number boolean', async () => {
    let test = new Types.TclSimple('1');
    test = test.getBoolean();
    expect(test).to.equal(true);
  });

  it('Number boolean false', async () => {
    let test = new Types.TclSimple('0');
    test = test.getBoolean();
    expect(test).to.equal(false);
  });

  it('Var boolean', async () => {
    let test = new Types.TclSimple('Well');
    test = test.getBoolean();
    expect(test).to.equal(true);
  });

  it('Var boolean false', async () => {
    let test = new Types.TclSimple('');
    test = test.getBoolean();
    expect(test).to.equal(false);
  });

  it('Unset object key', async () => {
    let test = new Types.TclObject();
    test.set('wow', new Types.TclSimple('wow'));

    let out = test.getSubValue('wow');
    expect(out.getValue()).to.equal('wow');

    test.unset('wow');

    try {
      test.getSubValue('wow');
    } catch (e) {
      expect(e.message).to.equal('no value found at given key: wow');
    }
  });

  it('Unset nonexistent object key', async () => {
    let test = new Types.TclObject();

    try {
      test.unset('wow');
    } catch (e) {
      expect(e.message).to.equal('cannot delete object item, item does not exist');
    }
  });

  it('Try to read object', async () => {
    let test = new Types.TclObject(undefined, 'aname');
    test.set('wow', new Types.TclSimple('wow'));

    try {
      test.getValue();
    } catch (e) {
      expect(e.message).to.equal('can\'t read "aname": variable is object');
    }
  });

  it('Try to read empty object key', async () => {
    let test = new Types.TclObject(undefined, 'aname');

    try {
      test.getSubValue('');
    } catch (e) {
      expect(e.message).to.equal('can\'t read "aname": variable is object');
    }
  });

  it('Unset array index', async () => {
    let test = new Types.TclArray([]);
    test.set(1, new Types.TclSimple('wow'));

    let out = test.getSubValue(1);
    expect(out.getValue()).to.equal('wow');

    test.unset(1);

    try {
      test.getSubValue(1);
    } catch (e) {
      expect(e.message).to.equal('no value found at given index: 1');
    }
  });

  it('Unset nonexistent array index', async () => {
    let test = new Types.TclArray();

    try {
      test.unset(1);
    } catch (e) {
      expect(e.message).to.equal('cannot delete array item, item does not exist');
    }
  });

  it('Try to read array', async () => {
    let test = new Types.TclArray(undefined, 'aname');
    test.set(1, new Types.TclSimple('wow'));

    try {
      test.getValue();
    } catch (e) {
      expect(e.message).to.equal('can\'t read "aname": variable is array');
    }
  });

  it('Try to read empty array index', async () => {
    let test = new Types.TclArray(undefined, 'aname');

    try {
      test.getSubValue(null);
    } catch (e) {
      expect(e.message).to.equal('can\'t read "aname": variable is array');
    }
  });
};
