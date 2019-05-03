import { Interpreter } from '../interpreter';
import { TclSimple } from '../types';
import { Scope } from '../scope';
import { TclError } from '../tclerror';
import { Parser } from '../mathParser';

// A regex to convert a variable name to its base name with appended object keys or array indexes
const variableRegex = /(?<fullname>(?<name>[^(\n]+)(\(((?<array>[0-9]+)|(?<object>[^\)]+))\))?)/;

/**
 * Function to load the procs into the scope
 *
 * @param  {Scope} scope
 */
export function Load(scope: Scope) {
  /**
   * set - reads and writes variables
   *
   * :: varName ?value?
   *
   * @see https://wiki.tcl-lang.org/page/set
   */
  scope.defineProc(
    'set',
    (interpreter, args, command, helpers) => {
      const [varName, tclValue] = args;

      // Interface for return object
      interface solveVarReturn {
        name: string;
        key: string | number | null;
      }

      /**
       * Function to destruct a variable into name/key combinations
       *
       * @param  {string} input - The raw variable
       * @returns solveVarReturn - The solved result
       */
      function solveVar(input: string): solveVarReturn {
        // Execute the regex
        let result = variableRegex.exec(input);
        // Check if succeed
        if (!result || !result.groups) return helpers.sendHelp('wvarname');

        // Remap the name and key accordingly
        let name = result.groups.name;
        let key = result.groups.object
          ? result.groups.object
          : result.groups.array
          ? parseInt(result.groups.array, 10)
          : null;

        // Return
        return {
          name,
          key,
        };
      }

      // If there are 2 arguments, set the variable
      if (args.length === 2) {
        if (!(tclValue instanceof TclSimple) || !(varName instanceof TclSimple))
          return helpers.sendHelp('wtype');

        let solved = solveVar(varName.getValue());
        interpreter.setVariable(solved.name, solved.key, tclValue);
        return tclValue;
      }
      // If there is 1 argument return the variable
      else if (args.length === 1) {
        if (!(varName instanceof TclSimple)) return helpers.sendHelp('wtype');

        let solved = solveVar(varName.getValue());
        return interpreter.getVariable(solved.name, solved.key);
      }

      // If there are any other amount of variables throw an error
      return helpers.sendHelp('wargs');
    },
    {
      helpMessages: {
        wvarname: `incorrect variable name`,
      },
      arguments: {
        pattern: 'set varName ?newValue?',
        amount: {
          start: 1,
          end: 2,
        },
      },
    },
  );

  /**
   * unset — Delete variables
   *
   * :: ?-nocomplain? varName ?varName ...?
   *
   * @see https://wiki.tcl-lang.org/page/unset
   */
  scope.defineProc(
    'unset',
    (interpreter, args, command, helpers) => {
      args = <string[]>args;

      // Set the nocomplain variable
      let nocomplain = false;
      if (args[0] === '-nocomplain') {
        nocomplain = true;
        args.shift();
      }

      // Loop over every argument and unset it
      for (let arg of args) {
        interpreter.scope.undefine(arg, nocomplain);
      }

      return new TclSimple('');
    },
    {
      arguments: {
        pattern: 'unset ?-nocomplain? varName ?varName ...?',
        textOnly: true,
        amount: {
          start: 1,
          end: -1,
        },
      },
    },
  );

  /**
   * expr — Evaluates an expression
   *
   * :: arg ?arg arg ...?
   *
   * @see https://wiki.tcl-lang.org/page/expr
   */
  scope.defineProc(
    'expr',
    async (interpreter, args, command, helpers) => {
      let expression = args.join(' ');

      let solvedExpression = await helpers.solveExpression(expression);

      let parser = new Parser();
      // Try to solve the expression and return the result
      let result = parser.parse(solvedExpression).evaluate();

      //Check if the result is usable
      if (typeof result === 'boolean') result = result ? 1 : 0;
      if (typeof result !== 'number')
        throw new TclError('expression result is not a number');
      if (result === Infinity)
        throw new TclError('expression result is infinity');

      return new TclSimple(`${result}`);
    },
    {
      arguments: {
        textOnly: true,
        pattern: 'expr arg ?arg arg ...?',
        amount: {
          start: 1,
          end: -1,
        },
      },
    },
  );

  /**
   * eval — Evaluates tcl code
   *
   * :: arg ?arg arg ...?
   *
   * @see https://wiki.tcl-lang.org/page/eval
   */
  scope.defineProc(
    'eval',
    async (interpreter, args, command, helpers) => {
      let code = args.join(' ');

      // Interpret the tcl code with a subscope
      let newInterpreter = new Interpreter(
        interpreter.tcl,
        code,
        new Scope(interpreter.scope),
      );

      // Return the result
      return await newInterpreter.run();
    },
    {
      helpMessages: {
        wargs: `wrong # args`,
        wtype: `wrong type`,
      },
      arguments: {
        textOnly: true,
        pattern: 'eval arg ?arg arg ...?',
        amount: {
          start: 1,
          end: -1,
        },
      },
    },
  );

  /**
   * info — provides information about the state of a Tcl interpreter
   *
   * :: option ?arg arg ...?
   *
   * @see https://wiki.tcl-lang.org/page/info
   */
  scope.defineProc(
    'info',
    (interpreter, args, command, helpers) => {
      let type = args.shift();

      // Execute the correct thing
      switch (type) {
        case 'commands':
          return new TclSimple('commands');
      }

      return new TclSimple('');
    },
    {
      arguments: {
        pattern: 'info option ?arg arg ...?',
        textOnly: true,
        amount: 1,
      },
    },
  );

  scope.defineProc(
    'wait',
    async (interpreter, args, command, helpers) => {
      const timeout = (ms: number) => new Promise((res) => setTimeout(res, ms));

      let number = args[0];
      if (!(number instanceof TclSimple)) return helpers.sendHelp('wtype');
      if (!number.isNumber()) return helpers.sendHelp('wtype');

      let ms = number.getNumber(true);

      await timeout(ms);
      return new TclSimple('');
    },
    {
      arguments: {
        pattern: 'wait time',
        amount: 1,
      },
    },
  );
}
