const Tcl = require('../dist/tcl');
const chai = require('chai');
const catchStdout = require('./testConsole').stdout;
const catchStderr = require('./testConsole').stderr;
const fs = require('fs');
const Yaml = require('js-yaml');
const expect = chai.expect;

const mainTestFile = './test/tests.yml';
const yamlString = fs.readFileSync(mainTestFile, 'utf-8');
const yaml = Yaml.safeLoad(yamlString);

describe(`Tcl (${mainTestFile})`, runKey(yaml));

function runKey(keys) {
  return () => {
    for (let testKey in keys) {
      let test = keys[testKey];

      let filename = null;
      if (typeof test === 'string') {
        filename = './test/' + test;

        if (test.endsWith('.yml')) {
          let file = fs.readFileSync(filename, 'utf-8');
          test = Yaml.safeLoad(file);
        } else if (test.endsWith('.js')) {
          describe(
            testKey + (filename ? ` - (${filename})` : ''),
            require('./' + test),
          );
          test = null;
        } else {
          throw new Error('Wrong file: ' + test);
        }
      }

      if (Array.isArray(test)) {
        describe(testKey + (filename ? ` - (${filename})` : ''), () => {
          for (let partTest of test) {
            partTest.output = partTest.output || {
              type: 'raw',
              value: '',
            };

            partTest.stdout = partTest.stdout || {
              type: 'raw',
              value: '',
            };

            partTest.stderr = partTest.stderr || {
              type: 'raw',
              value: '',
            };

            partTest.args = partTest.args || [];

            it(
              partTest.name +
                (partTest.input.type === 'file'
                  ? ` - (./test/${partTest.input.value})`
                  : ''),
              runTest(partTest),
            );
          }
        });
      } else if (test !== null) {
        describe(testKey + (filename ? ` - (${filename})` : ''), runKey(test));
      }
    }
  };
}

function runTest(partTest) {
  return async () => {
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
    let stderr = '';
    try {
      stderr = await catchStderr.inspectSync(async () => {
        stdout = await catchStdout.inspectSync(async () => {
          if (partTest.input.type === 'file')
            output = await tcl.runFile('./test/' + input);
          else output = await tcl.run(input);

          output = output.getValue();
        });
      });
      stdout = stdout.join('');
      stderr = stderr.join('');
    } catch (e) {
      //console.log({partTest, e})
      if (partTest.output.type === 'error') {
        expect(e.name).to.equal('TclError');
      } else {
        throw e;
      }
    }

    if (partTest.output.type !== 'error') expect(output).to.equal(testOutput);

    expect(stdout).to.equal(testStdout);
  };
}
