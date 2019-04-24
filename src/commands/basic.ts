import { Interpreter } from '../interpreter';
import * as math from 'mathjs';
import {
  TclVariable,
  TclProcFunction,
  TclSimple,
  TclProcHelpers,
} from '../types';
import { Scope } from '../scope';
import { TclError } from '../tclerror';
import { resolve } from 'dns';
import { CommandToken } from '../parser';

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
    (
      interpreter: Interpreter,
      args: Array<TclVariable>,
      command: CommandToken,
      helpers: TclProcHelpers,
    ): TclVariable => {
      const [varName, tclValue] = args;

      // If there are 2 arguments, set the variable
      if (args.length === 2) {
        if (!(tclValue instanceof TclSimple) || !(varName instanceof TclSimple))
          return helpers.sendHelp('wtype');

        interpreter.setVariable(varName.getValue(), tclValue);
        return tclValue;
      }
      // If there is 1 argument return the variable
      else if (args.length === 1) {
        if (!(varName instanceof TclSimple)) return helpers.sendHelp('wtype');
        return interpreter.getVariable(varName.getValue());
      }

      // If there are any other amount of variables throw an error
      return helpers.sendHelp('wargs');
    },
    {
      pattern: 'set varName ?newValue?',
      helpMessages: {
        wargs: `wrong # args`,
        wtype: `wrong type`,
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
    (
      interpreter: Interpreter,
      args: Array<TclVariable>,
      command: CommandToken,
      helpers: TclProcHelpers,
    ): TclVariable => {
      // Check if there are enough arguments
      if (args.length === 0) return helpers.sendHelp('wargs');

      // Check if arguments are correct
      for (let arg of args) {
        if (!(arg instanceof TclSimple)) return helpers.sendHelp('wtype');
      }

      // Set the nocomplain variable
      let nocomplain = false;
      if (args[0].getValue() === '-nocomplain') {
        nocomplain = true;
        args.shift();
      }

      // Loop over every argument and unset it
      for (let arg of args) {
        interpreter.scope.undefine(arg.getValue());
      }

      return new TclSimple('');
    },
    {
      pattern: 'unset ?-nocomplain? varName ?varName ...?',
      helpMessages: {
        wargs: `wrong # args`,
        wtype: `wrong type`,
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
    (
      interpreter: Interpreter,
      args: Array<TclVariable>,
      command: CommandToken,
      helpers: TclProcHelpers,
    ): TclVariable => {
      // Check if there are enough arguments
      if (args.length === 0) return helpers.sendHelp('warg');

      // Check if arguments are correct
      for (let arg of args) {
        if (!(arg instanceof TclSimple)) return helpers.sendHelp('wtype');
      }

      // Create a full expression by joining all arguments
      let stringArgs = args.map((arg) => arg.getValue());
      let expression = stringArgs.join(' ');

      let solvedExpression = interpreter.processVariables(expression);
      if (typeof solvedExpression !== 'string')
        throw new TclError('expression resolved to variable instead of string');

      // Try to solve the expression and return the result
      let result = math.eval(solvedExpression);

      //Check if the result is usable
      if (typeof result !== 'number')
        throw new TclError('expression result is not a number');
      if (result === Infinity)
        throw new TclError('expression result is infinity');

      return new TclSimple(`${result}`);
    },
    {
      pattern: 'expr arg ?arg arg ...?',
      helpMessages: {
        wargs: `wrong # args`,
        wtype: `wrong type`,
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
    async (
      interpreter: Interpreter,
      args: Array<TclVariable>,
      command: CommandToken,
      helpers: TclProcHelpers,
    ): Promise<TclVariable> => {
      // Check if there are enough arguments
      if (args.length === 0) return helpers.sendHelp('warg');

      // Check if arguments are correct
      for (let arg of args) {
        if (!(arg instanceof TclSimple)) return helpers.sendHelp('wtype');
      }

      // Create a full expression by joining all arguments
      let stringArgs = args.map((arg) => arg.getValue());
      let code = stringArgs.join(' ');

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
      pattern: 'eval arg ?arg arg ...?',
      helpMessages: {
        wargs: `wrong # args`,
        wtype: `wrong type`,
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
    (
      interpreter: Interpreter,
      args: Array<TclVariable>,
      command: CommandToken,
      helpers: TclProcHelpers,
    ): TclVariable => {
      // Check if there are enough arguments
      if (args.length === 0) return helpers.sendHelp('wargs');

      let type = args.shift();
      if (!(type instanceof TclSimple)) return helpers.sendHelp('wtype');

      // Execute the correct thing
      switch (type.getValue()) {
        case 'commands':
          return new TclSimple('commands');
      }

      return new TclSimple('');
    },
    {
      pattern: 'info option ?arg arg ...?',
      helpMessages: {
        wargs: `wrong # args`,
        wtype: `wrong type`,
      },
    },
  );

  scope.defineProc(
    'wait',
    async (
      interpreter: Interpreter,
      args: Array<TclVariable>,
      command: CommandToken,
      helpers: TclProcHelpers,
    ): Promise<TclVariable> => {
      const timeout = (ms: number) => new Promise((res) => setTimeout(res, ms));

      await timeout(2000);
      return new TclSimple('wow');
    },
  );
}
