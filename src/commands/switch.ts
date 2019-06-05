import * as minimatch from 'minimatch';
import { TclSimple, TclList } from '../types';
import { Scope } from '../scope';
import { Interpreter } from '../interpreter';
import { TclError } from '../tclerror';
import { Lexer } from '../lexer';

/**
 * Function to load the procs into the scope
 *
 * @export
 * @param {Scope} scope
 */
export function Load(scope: Scope) {
  /**
   * switch ?options? string {
   *   pattern1 {
   *     body1
   *   }
   *   ?pattern2 {
   *     body2
   *   }?
   *   ...
   *   ?patternN {
   *     bodyN
   *   }?
   * }
   *
   * @see https://wiki.tcl-lang.org/page/switch
   */
  scope.defineProc(
    'switch',
    async (interpreter, args, command, helpers) => {
      args = <string[]>args;

      // Intialize options
      let options: {
        type: null | string;
        nocase: boolean;
        matchVar: null | string;
        indexVar: null | string;
      } = {
        type: null,
        nocase: false,
        matchVar: null,
        indexVar: null,
      };

      // Easy function to throw errors
      function setType(type: string) {
        if (options.type !== null) return helpers.sendHelp('wset');
        options.type = type;
      }

      // Loop over all parsed options
      let arg;
      while ((arg = args.shift())) {
        // Stop reading options when the arguments stop starting with -
        if (!arg.startsWith('-')) {
          args.unshift(arg);
          break;
        }
        // Stop reading options when the argument is --
        if (arg === '--') break;

        // Type options
        if (arg === '-exact') setType('exact');
        else if (arg === '-glob') setType('glob');
        else if (arg === '-regexp') setType('regexp');
        // Case sensitive
        else if (arg === '-nocase') options.nocase = true;
        // Advanced options
        else if (arg === '-matchvar') {
          let matchvar = args.shift();
          if (!matchvar) return helpers.sendHelp('wargs');

          options.matchVar = matchvar;
        } else if (arg === '-indexvar') {
          let indexvar = args.shift();
          if (!indexvar) return helpers.sendHelp('wargs');

          options.indexVar = indexvar;
        } else {
          throw new TclError('unrecognized option: ' + arg);
        }
      }

      // Verify arguments
      if (!options.type) options.type = 'exact';
      if (options.type !== 'regexp' && (options.matchVar || options.indexVar))
        return helpers.sendHelp('needregexp');

      // Read the string to match against
      let matchAgainst = args.shift();
      if (!matchAgainst) return helpers.sendHelp('wargs');
      if (options.nocase) matchAgainst = matchAgainst.toLowerCase();

      // Check how many arguments are left
      // If none, error
      if (args.length === 0) return helpers.sendHelp('wargs');
      // If 1, parse the argument
      else if (args.length === 1) {
        // Test if there is data
        let toLex = args.shift();
        if (!toLex) return helpers.sendHelp('wargs');

        // Create a new lexer
        let lexer = new Lexer(toLex);

        // Read all tokens back into the args variable
        let token;
        while ((token = lexer.nextToken())) {
          args.push(token.value);
        }
      }

      // Check if there are enough arguments for a switch statement
      if (args.length <= 1) return helpers.sendHelp('wargs');

      // Create a new array for all switch operations
      let switchOps: Array<{
        expression: string;
        code: string;
      }> = [];

      // Loop over the left args and put them in their corresponding place in the switchops
      let prop;
      while ((prop = args.shift())) {
        let expression = prop;
        let code = args.shift();
        if (!code) return helpers.sendHelp('wargs');

        switchOps.push({
          expression,
          code,
        });
      }

      // Function to get the code at a index while correctly parsing the - character
      function getCodeAtIndex(index: number): string {
        if (!switchOps[index]) return helpers.sendHelp('nocode');
        let code = switchOps[index].code;
        if (code === '-') return getCodeAtIndex(index + 1);
        else return code;
      }

      // A variable for the code that will eventually be ran
      let runCode: null | string = null;

      // Check for exact match
      if (options.type === 'exact') {
        for (let i = 0; i < switchOps.length; i++) {
          let op = switchOps[i];
          if (options.nocase) op.expression = op.expression.toLowerCase();

          if (op.expression === 'default') continue;

          if (op.expression === matchAgainst) {
            runCode = getCodeAtIndex(i);
            break;
          }
        }
      }

      // Check for a global match
      else if (options.type === 'glob') {
        for (let i = 0; i < switchOps.length; i++) {
          let op = switchOps[i];
          if (options.nocase) op.expression = op.expression.toLowerCase();

          if (op.expression === 'default') continue;

          if (minimatch(matchAgainst, op.expression, { nocomment: true })) {
            runCode = getCodeAtIndex(i);
            break;
          }
        }
      }

      // Check for a regular expression match
      else if (options.type === 'regexp') {
        for (let i = 0; i < switchOps.length; i++) {
          let op = switchOps[i];
          if (options.nocase) op.expression = op.expression.toLowerCase();
          if (op.expression === 'default') continue;

          let rex = new RegExp(op.expression, 'u');
          let rexResults = rex.exec(matchAgainst);
          if (rexResults !== null) {
            if (options.matchVar) {
              let listResult = TclList.createList(rexResults);
              interpreter.setVariable(options.matchVar, null, listResult);
            }

            if (options.indexVar) {
              let indexv = [];
              for (let rexResult of rexResults) {
                let foundIndex = matchAgainst.indexOf(rexResult);
                indexv.push([foundIndex, foundIndex + rexResult.length - 1]);
              }

              let listResult = TclList.createList(indexv);
              interpreter.setVariable(options.indexVar, null, listResult);
            }

            runCode = getCodeAtIndex(i);
            break;
          }
        }
      }

      // If non throw an error
      else {
        throw new TclSimple('invalid switchtype');
      }

      // Check if there is code, if not try to find a default statement
      if (!runCode) {
        for (let i = 0; i < switchOps.length; i++) {
          let op = switchOps[i];
          op.expression = op.expression.toLowerCase();
          if (op.expression === 'default') {
            runCode = getCodeAtIndex(i);
            break;
          }
        }

        // If there is still nothing return an empty var
        if (!runCode) return new TclSimple('');
      }

      // Interpret the procedures tcl code with the new scope
      let newInterpreter = new Interpreter(
        interpreter.getTcl(),
        runCode,
        new Scope(interpreter.getScope()),
      );

      // Return the result
      return newInterpreter.run();
    },
    {
      arguments: {
        pattern: `switch ?options? string { pattern1 { body1 } ?pattern2 { body2 }? ... ?patternN { bodyN }? }`,
        textOnly: true,
        amount: {
          start: 2,
          end: -1,
        },
      },
      helpMessages: {
        wset: 'type of switch was already set',
        needregexp:
          'You need the -regexp flag enabled to use -indexvar or -matchvar',
        nocode:
          'there was no executable code to be found with the correct expression',
      },
    },
  );
}
