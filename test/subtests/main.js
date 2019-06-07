const { Tcl } = require('../../dist/tcl');
const { IO } = require('../../dist/io');
const { TclVariable, TclSimple, TclList } = require('../../dist/types');
const expect = require('chai').expect;
const catchStdout = require('../testConsole').stdout;

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

  it('Add empty external function', async () => {
    let tcl = new Tcl();
    let toChange = 'one';

    tcl.addSimpleProcedure('testing', (one) => {
      toChange = one;
    });

    let out = await tcl.run('testing world');

    expect(out).to.be.an.instanceof(TclVariable);
    expect(out.getValue()).to.equal('');
    expect(toChange).to.equal('world');
  });

  it('Add advanced external function', async () => {
    let tcl = new Tcl();
    let toChange = 'one';

    tcl.addAdvancedProcedure(
      'testing',
      (interpreter, args, command, helpers) => {
        return new TclSimple(
          'hello ' + args[0].getValue() + ' in ' + command.command,
        );
      },
    );

    let out = await tcl.run('testing world');

    expect(out).to.be.an.instanceof(TclVariable);
    expect(out.getValue()).to.equal('hello world in testing');
  });

  describe('External variable changing', () => {
    it('Handle string variables', async () => {
      let tcl = new Tcl();

      tcl.setVariable('test', 'Hello World!');

      stdout = await catchStdout.inspectSync(async () => {
        await tcl.run('puts $test');
      });
      stdout = stdout.join('');

      expect(stdout).to.equal('Hello World!\n');
    });

    it('Handle number variables', async () => {
      let tcl = new Tcl();

      tcl.setVariable('test', 69);

      stdout = await catchStdout.inspectSync(async () => {
        await tcl.run('puts $test');
      });
      stdout = stdout.join('');

      expect(stdout).to.equal('69\n');
    });

    it('Handle boolean variables', async () => {
      let tcl = new Tcl();

      tcl.setVariable('test', true);

      stdout = await catchStdout.inspectSync(async () => {
        await tcl.run('puts $test');
      });
      stdout = stdout.join('');

      expect(stdout).to.equal('true\n');
    });

    it('Handle array variables', async () => {
      let tcl = new Tcl();

      tcl.setVariable('test', ['zero', 'one', 'two', 'three']);

      stdout = await catchStdout.inspectSync(async () => {
        await tcl.run('puts "$test(0) $test(1) $test(2) $test(3)"');
      });
      stdout = stdout.join('');

      expect(stdout).to.equal('zero one two three\n');
    });

    it('Handle nested array variables', async () => {
      let tcl = new Tcl();

      tcl.setVariable('test', ['zero', ['one', 'two'], 'three']);

      stdout = await catchStdout.inspectSync(async () => {
        await tcl.run('puts "$test(0) $test(1) $test(2)"');
      });
      stdout = stdout.join('');

      expect(stdout).to.equal('zero one,two three\n');
    });

    it('Handle object variables', async () => {
      let tcl = new Tcl();

      tcl.setVariable('test', { one: 1, two: 2, three: 3 });

      stdout = await catchStdout.inspectSync(async () => {
        await tcl.run('puts "$test(one) $test(two) $test(three)"');
      });
      stdout = stdout.join('');

      expect(stdout).to.equal('1 2 3\n');
    });

    it('Dont handle nested object variables', async () => {
      let tcl = new Tcl();

      tcl.setVariable('test', { one: 1, two: { deeper: 2 }, three: 3 });

      stdout = await catchStdout.inspectSync(async () => {
        await tcl.run('puts "$test(one) $test(two) $test(three)"');
      });
      stdout = stdout.join('');

      expect(stdout).to.equal('1 [object Object] 3\n');
    });

    it('Read string variables', async () => {
      let tcl = new Tcl();

      await tcl.run('set test {Hello World!}');

      let out = tcl.getVariable('test');

      expect(out).to.equal('Hello World!');
    });

    it('Read number variables', async () => {
      let tcl = new Tcl();

      await tcl.run('set test 69');

      let out = tcl.getVariable('test');

      expect(out).to.equal(69);
    });

    it('Read advanced number variables', async () => {
      let tcl = new Tcl();

      await tcl.run('set test 69.69');

      let out = tcl.getVariable('test');

      expect(out).to.equal(69.69);
    });

    it('Read boolean variables', async () => {
      let tcl = new Tcl();

      await tcl.run('set test1 true; set test2 on; set test3 yes');

      let out1 = tcl.getVariable('test1');
      let out2 = tcl.getVariable('test2');
      let out3 = tcl.getVariable('test3');

      expect(out1).to.equal(true);
      expect(out2).to.equal(true);
      expect(out3).to.equal(true);
    });

    it('Read boolean false', async () => {
      let tcl = new Tcl();

      await tcl.run('set test1 false; set test2 off; set test3 no');

      let out1 = tcl.getVariable('test1');
      let out2 = tcl.getVariable('test2');
      let out3 = tcl.getVariable('test3');

      expect(out1).to.equal(false);
      expect(out2).to.equal(false);
      expect(out3).to.equal(false);
    });

    it('Read array variables', async () => {
      let tcl = new Tcl();

      await tcl.run('set test(0) zero; set test(1) one;');

      let out = tcl.getVariable('test');

      expect(out).to.eql(['zero', 'one']);
    });

    it('Read advanced array variables', async () => {
      let tcl = new Tcl();

      await tcl.run('set test(0) zero; set test(1) 1; set test(2) true');

      let out = tcl.getVariable('test');

      expect(out).to.eql(['zero', 1, true]);
    });

    it('Read sparse array variables', async () => {
      let tcl = new Tcl();

      await tcl.run('set test(0) zero; set test(3) three;');

      let out = tcl.getVariable('test');

      expect(out).to.eql(['zero', undefined, undefined, 'three']);
    });

    it('Read object variables', async () => {
      let tcl = new Tcl();

      await tcl.run('set test(zero) 0; set test(one) 1;');

      let out = tcl.getVariable('test');

      expect(out).to.eql({ zero: 0, one: 1 });
    });

    it('Read advanced variables', async () => {
      let tcl = new Tcl();

      await tcl.run('set test(zero) 0; set test(one) one; set test(two) yes');

      let out = tcl.getVariable('test');

      expect(out).to.eql({ zero: 0, one: 'one', two: true });
    });

    it('Variable already set', async () => {
      let tcl = new Tcl();

      await tcl.run('set test oi');

      try {
        tcl.setVariable('test', 'Hello World!');
      } catch (e) {
        expect(e.message).to.equal('Variable test has already been set!');
      }
    });

    it('Variable already set but force', async () => {
      let tcl = new Tcl();

      await tcl.run('set test oi');

      tcl.setVariable('test', 'Hello World!', true);

      stdout = await catchStdout.inspectSync(async () => {
        await tcl.run('puts $test');
      });
      stdout = stdout.join('');

      expect(stdout).to.equal('Hello World!\n');
    });

    it('Unsupported variable', async () => {
      let tcl = new Tcl();

      try {
        tcl.setVariable('test', null);
      } catch (e) {
        expect(e.message).to.equal('Unsupported variable type!');
      }
    });

    it('Fetching nonexistent variable', async () => {
      let tcl = new Tcl();
      try {
        tcl.getVariable('test');
      } catch (e) {
        expect(e.message).to.equal('Could not find variable');
      }
    });

    it('Fetching nonexistent variable with force', async () => {
      let tcl = new Tcl();

      let out = tcl.getVariable('test', true);

      expect(out).to.equal('');
    });

    it('Fetching wrong variable', async () => {
      let tcl = new Tcl();

      tcl.globalScope.define('test', new TclList(''));
      try {
        tcl.getVariable('test');
      } catch (e) {
        expect(e.message).to.equal(
          'Could not convert variable to js equivalent',
        );
      }
    });

    it('Fetching wrong variable with force', async () => {
      let tcl = new Tcl();

      tcl.globalScope.define('test', new TclList(''));

      let out = tcl.getVariable('test', true);

      expect(out).to.equal('');
    });
  });
};
