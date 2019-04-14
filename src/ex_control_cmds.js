const types = require('./types');
const utils = require('./utils');
const DictObj = require('./objtype_dict');
const ListObj = require('./objtype_list');
const IntObj = require('./objtype_int');

let { TclError } = types;
let { TclResult } = types;
let { EmptyString } = types;
let intZero = new IntObj(0);
let intThree = new IntObj(3);
let intFour = new IntObj(4);

function install(interp) {
  if (interp.register_extension('ex_control_cmds')) {
    return;
  }

  /* Core control structures still to implement:
   * switch
   */

  interp.registerCommand('continue', (args) => {
    interp.checkArgs(args, 0, '');
    return new TclResult(
      types.CONTINUE,
      EmptyString,
      ['-level', intZero, '-code', intFour],
      0,
      4,
    );
  });

  interp.registerCommand('break', (args) => {
    interp.checkArgs(args, 0, '');
    return new TclResult(
      types.BREAK,
      EmptyString,
      ['-level', intZero, '-code', intThree],
      0,
      3,
    );
  });

  interp.registerCommand('error', (args) => {
    interp.checkArgs(args, [1, 3], 'message ?info? ?code?');
    return new TclError(
      args[1],
      args[2] !== undefined ? args[2].GetList() : ['NONE'],
      args[3],
    );
  });

  interp.registerCommand('throw', (args) => {
    interp.checkArgs(args, 2, 'type message');
    return new TclError(
      args[2],
      args[1] !== undefined ? args[1].GetList() : ['NONE'],
    );
  });

  interp.registerAsyncCommand('try', (c, args) => {
    let body;
    let finallyscript;
    let handlers = [];
    let type;
    let match;
    let varlist;
    let script;
    let i = 0;
    interp.checkArgs(args, [1, null], 'body ?handler...? ?finally script?');
    args.shift();
    body = args.shift();
    if (args.length >= 2) {
      if (args[args.length - 2] === 'finally') {
        finallyscript = args.pop();
        args.pop();
      }
    }
    if (args % 4 !== 0) {
      interp.checkArgs(args, 0, 'body ?handler...? ?finally script?');
    }
    while (i < args.length) {
      type = args[i];
      i += 1;
      match = args[i];
      i += 1;
      varlist = args[i].GetList();
      i += 1;
      if (varlist.length > 2) {
        throw new TclError('Too many variable names for try handler');
      }
      script = args[i];
      i += 1;
      switch (type.toString()) {
        case 'on':
          type = 0;
          if (interp.str_return_codes[match.toString()] !== undefined) {
            match = interp.str_return_codes[match.toString()];
          } else {
            match = match.GetInt();
          }
          break;
        case 'trap':
          match = match.GetList();
          type = 1;
          break;
        default:
          throw new TclError(`Invalid handler type: "${type.toString()}"`);
      }
      handlers.push([type, match, varlist, script]);
    }

    function dofinally(res) {
      if (finallyscript) {
        return interp.exec(finallyscript, (finallyRes) => {
          if (finallyRes.code === types.OK) {
            return c(res);
          }
          return c(finallyRes);
        });
      }
      return c(res);
    }

    function matches(res, handler) {
      let errorcode;
      if (handler[0] === 0) {
        // on handler
        return res.code === handler[1];
      }
      // trap handler
      errorcode = res.options['-errorcode'] || [];
      for (let j = 0; j < handler[1].length; j++) {
        if (handler[1][j].toString() !== errorcode[j].toString()) {
          return false;
        }
      }
      return true;
    }

    return interp.exec(body, (res) => {
      let handler;
      for (i = 0; i < handlers.length; i++) {
        if (matches(res, handlers[i])) {
          handler = handlers[i];
          break;
        }
      }
      if (handler) {
        if (handler[2][0]) {
          interp.set_scalar(handler[2][0], res.result);
        }
        if (handler[2][1]) {
          interp.set_scalar(handler[2][1], new DictObj(res.options));
        }
        return interp.exec(handler[3], res2 => dofinally(res2));
      }
      return dofinally(res);
    });
  });

  interp.registerAsyncCommand('if', (c, args, In) => {
    In.checkArgs(args, [2, null], 'expression script ?args ...?');
    let i = 1;

    return function next() {
      let retf = In._TclExpr(args[i], (res) => {
        if (res.code !== types.OK) {
          return c(res);
        }
        if (res.result.GetBool()) {
          if (args[i].toString() === 'then') {
            i += 1;
          }
          return In.exec(args[i], c);
        }
        i += 1; // skip then body
        if (i >= args.length) {
          return c(In.EmptyString);
        }
        let toswitch = args[i].toString();
        i += 1;
        switch (toswitch) {
          case 'elseif':
            return next;
          case 'else':
            return In.exec(args[i], c);
          default:
            return In.exec(args[i - 1], c);
        }
      });
      i += 1;
      return retf;
    };
  });

  interp.registerAsyncCommand('switch', (c, args, I) => {
    let arg;
    let cmp;
    let eatingArgs = true;
    let ignorecase = false;
    let defaultHandler;
    let matchvar;
    let indexvar;
    let str;
    let patterns;
    let cmdname = args.shift();
    let i;

    function cmpExact(pat) {
      return pat.toString() === str;
    }

    function cmpExactNocase(pat) {
      return pat.toString().toLowerCase() === str;
    }

    function cmpGlob(pat) {
      return utils.glob2regex(pat).test(str, ignorecase);
    }

    function cmpRegexp(pat) {
      let m;
      let re;
      let indices = [];
      let j;
      // TODO somehow translate pat (which is a Tcl style regex) to a
      // javascript style regex
      re = new RegExp(pat, ignorecase ? 'i' : '');
      m = re.exec(str);
      if (m) {
        if (matchvar !== undefined) {
          I.set_var(matchvar, new ListObj(m));
        }
        if (indexvar !== undefined) {
          indices.push(new ListObj([m.index, m.index + m[0].length]));
          // TODO: somehow get the indices of the submatches, the
          // hack below is not reliable
          for (j = 1; j < m.length; j++) {
            indices.push(str.indexOf(m[j], m.index));
          }
          I.set_var(indexvar, new ListObj(indices));
        }
        return true;
      }
      return false;
    }

    cmp = cmpGlob;

    while (eatingArgs && args.length > 2) {
      arg = args[0].toString();
      if (arg.charAt(0) !== '-') {
        break;
      }
      args.shift();
      switch (arg) {
        case '-exact':
          cmp = cmpExact;
          break;
        case '-glob':
          cmp = cmpGlob;
          break;
        case '-regexp':
          cmp = cmpRegexp;
          break;
        case '-nocase':
          ignorecase = true;
          break;
        case '-matchvar':
          matchvar = args.shift();
          break;
        case '-indexvar':
          indexvar = args.shift();
          break;
        case '--':
          eatingArgs = false;
          break;
        default:
          throw new TclError(
            `bad option "${arg}" must be -exact, -glob, -indexvar, -matchvar, -nocase, -regexp, or --`,
            ['TCL', 'LOOKUP', 'INDEX', 'option', arg],
          );
      }
    }

    str = args.shift();
    if (args.length === 1) {
      patterns = args[0];
    } else {
      patterns = args;
    }
    if (
      str === undefined ||
      patterns === undefined ||
      patterns.length % 2 !== 0
    ) {
      I.checkArgs(
        [cmdname],
        2,
        '?options? string {pattern body ?pattern body ...?}',
      );
    }
    if (ignorecase) {
      str = str.toString().tolowerCase();
    } else {
      str = str.toString();
    }
    if (cmp !== cmpRegexp) {
      if (matchvar !== undefined) {
        throw new TclError('-matchvar option requries -regexp option', [
          'TCL',
          'OPERATION',
          'SWITCH',
          'MODERESTRICTION',
        ]);
      }
      if (indexvar !== undefined) {
        throw new TclError('-indexvar option requries -regexp option', [
          'TCL',
          'OPERATION',
          'SWITCH',
          'MODERESTRICTION',
        ]);
      }
    }
    if (cmp === cmpExact && ignorecase) {
      cmp = cmpExactNocase;
    }

    if (patterns[patterns.length - 2].toString() === 'default') {
      defaultHandler = patterns.pop();
      patterns.pop();
    }

    for (i = 0; i < patterns.length; i += 2) {
      if (cmp(patterns[i])) {
        return I.exec(patterns[i + 1], c);
      }
    }
    if (defaultHandler !== undefined) {
      if (matchvar !== undefined) {
        I.set_var(matchvar, new ListObj());
      }
      if (indexvar !== undefined) {
        I.set_var(indexvar, new ListObj());
      }
      return I.exec(defaultHandler, c);
    }
    return EmptyString;
  });

  interp.registerAsyncCommand('for', (c, args) => {
    interp.checkArgs(args, 4, 'start test next body');
    let start = args[1];
    let next = args[3];
    let body = args[4];
    return interp.exec(start, (res) => {
      if (res.code !== types.OK) {
        return c(res);
      }
      return function loop() {
        return interp._TclExpr(args[2], (r) => {
          if (!r.result.GetBool()) return c();
          return interp.exec(body, (res2) => {
            switch (res2.code) {
              case types.CONTINUE:
              case types.OK:
                return interp.exec(next, (res3) => {
                  if (res3.code !== types.OK) {
                    return c(res3);
                  }
                  return loop;
                });
              case types.BREAK:
                return c();
              default:
                return c(res2);
            }
          });
        });
      };
    });
  });

  interp.registerAsyncCommand('while', (c, args) => {
    interp.checkArgs(args, 2, 'test body');
    let test = args[1];
    let body = args[2];
    return function loop() {
      return interp._TclExpr(test, (res) => {
        if (res.code !== types.OK) {
          return c(res);
        }
        if (!res.result.GetBool()) {
          return c();
        }
        return interp.exec(body, (res2) => {
          switch (res2.code) {
            case types.CONTINUE:
            case types.OK:
              return loop;
            case types.BREAK:
              return c();
            default:
              return c(res2);
          }
        });
      });
    };
  });

  function foreach(collecting) {
    return function (c, args) {
      if (args.length < 4 || args.length % 2 !== 0) {
        interp.checkArgs(args, 3, 'varlist1 list1 ?varlist2 list2 ...? body');
      }
      let acc = collecting ? [] : undefined;
      let loopvardesc = args.slice(1, -1);
      let body = args[args.length - 1];
      let i = 0;
      let j;
      let varlists = [];
      let lists = [];
      let listptrs = [];

      function done() {
        let k = lists.length;
        while (k > 0) {
          k -= 1;
          if (listptrs[k] < lists[k].length) {
            return false;
          }
        }
        return true;
      }

      while (i < loopvardesc.length) {
        varlists.push(loopvardesc[i].GetList());
        i += 1;
        lists.push(loopvardesc[i].GetList());
        i += 1;
        listptrs.push(0);
      }
      return function loop() {
        if (done()) {
          return c(acc);
        }
        for (i = 0; i < varlists.length; i++) {
          for (j = 0; j < varlists[i].length; j++) {
            interp.set_scalar(
              varlists[i][j],
              lists[i][listptrs[i]] || types.EmptyString,
            );
            listptrs[i] += 1;
          }
        }
        return interp.exec(body, (res) => {
          switch (res.code) {
            case types.OK:
              if (acc) {
                acc.push(res.result);
              }
            // falls through
            case types.CONTINUE:
              return loop;

            case types.BREAK:
              return c(acc);
            case types.ERROR:
              return c(res);
            default:
              return c(new TclError(`Unexpected result code: "${res.code}"`));
          }
        });
      };
    };
  }

  interp.registerAsyncCommand('foreach', foreach(false));
  interp.registerAsyncCommand('lmap', foreach(true));
}

module.exports = {
  install,
};
