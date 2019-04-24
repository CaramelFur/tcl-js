const Tcl = require('../dist/tcl');
const chai = require('chai');
const catchStdout = require('./testConsole').stdout;
const fs = require('fs');
const expect = chai.expect;

const jsonString = fs.readFileSync('./test/tests.json', 'utf-8');
const json = JSON.parse(jsonString);

describe('Tcl', () => {
  for (let testKey in json) {
    let test = json[testKey];
    describe(testKey, () => {
      for (let partTest of test) {
        it(partTest.name, async () => {
          partTest.output = partTest.output || {
            type: 'raw',
            value: '',
          };

          partTest.stdout = partTest.stdout || {
            type: 'raw',
            value: '',
          };

          partTest.args = partTest.args || [];

          let tcl = new Tcl.Tcl(...partTest.args);

          let input = partTest.input.value;

          let testOutput =
            partTest.output.type === 'file'
              ? fs.readFileSync('./test/' + partTest.output.value, 'utf-8')
              : partTest.output.value;
          let testStdout =
            partTest.stdout.type === 'file'
              ? fs.readFileSync('./test/' + partTest.stdout.value, 'utf-8')
              : partTest.stdout.value;

          let output = '';
          let stdout = '';
          try {
            stdout = await catchStdout.inspectSync(async () => {
              if (partTest.input.type === 'file')
                output = await tcl.runFile('./test/' + input);
              else output = await tcl.run(input);

              output = output.getValue();
            });
            stdout = stdout.join('');
          } catch (e) {
            if (partTest.output.type === 'error') {
              expect(e.name).to.equal('TclError');
            } else {
              throw e;
            }
          }

          if (partTest.output.type !== 'error')
            expect(output).to.equal(testOutput);

          expect(stdout).to.equal(testStdout);
        });
      }
    });
  }
});
