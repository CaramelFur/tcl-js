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
};
