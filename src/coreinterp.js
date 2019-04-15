const parser = require('./parser');
const tclobj = require('./tclobject');
const utils = require('./utils');
const types = require('./types');
const ScriptObj = require('./objtype_script');
const ExprObj = require('./objtype_expr');
const IntObj = require('./objtype_int');
const StringObj = require('./objtype_string');
const BoolObj = require('./objtype_bool');

let { TclError } = types;
let { TclResult } = types;
let { TclObject } = tclobj;
let { SCALAR } = types;
let { ARRAY } = types;
let { OK } = types;
let { ERROR } = types;
let { RETURN } = types;
let { BREAK } = types;
let { CONTINUE } = types;
let { OPERAND } = parser;
let { OPERATOR } = parser;
let { BOOL } = parser;
let { FLOAT } = parser;
let { INTEGER } = parser;
let { ARG } = parser;
let { MATHFUNC } = parser;
let { BRACED } = parser;
let { QUOTED } = parser;
let { VAR } = parser;
// ARRAY = parser.ARRAY,  <-- don't do this - it clashes with the import from types.ARRAY
let { SCRIPT } = parser;
let { EmptyString } = types;
let EmptyResult = new TclResult(OK, '');
let TrueResult = new TclResult(OK, new BoolObj(true));
let FalseResult = new TclResult(OK, new BoolObj(false));

function asTclError(e) {
  return e instanceof TclError ? e : new TclError(e);
}

function trampoline(resArg) {
  let res = resArg;
  while (typeof res === 'function' && res.tcl_break_trampoline === undefined) {
    res = res();
  }
  return res;
}

module.exports = function (...mainArgs) {
  let interpArgs = Array.prototype.slice.call(mainArgs);
  let I = this;
  let mathops;
  let mathfuncs;
  let mathopCache = [null, {}, {}];

  this.vars = {};
  this.commands = {};
  this.extensions = {};

  this.str_return_codes = {
    ok: new IntObj(OK),
    error: new IntObj(ERROR),
    return: new IntObj(RETURN),
    break: new IntObj(BREAK),
    continue: new IntObj(CONTINUE),
  };

  this.resolve_var = function (varname) {
    return this.vars[varname];
  };

  this.create_var = function (varname, index) {
    if (index === undefined) {
      this.vars[varname] = {
        type: SCALAR,
        value: EmptyString,
      };
      this.vars[varname].value.IncrRefCount();
    } else {
      this.vars[varname] = {
        type: ARRAY,
        value: {},
      };
    }
    return this.vars[varname];
  };

  this.delete_var = function (varname) {
    let arr;
    if (this.vars[varname] === undefined) {
      return;
    }
    switch (this.vars[varname].type) {
      case SCALAR:
        this.vars[varname].value.DecrRefCount();
        break;
      case ARRAY:
        arr = this.vars[varname].value;
        for (let i = 0; i < Object.keys(arr).length; i++) {
          let e = Object.keys(arr)[i];
          if (Object.prototype.hasOwnProperty.call(arr, e)) {
            arr[e].value.DecrRefCount();
            delete arr[e];
          }
        }
        break;
      default:
    }
    delete this.vars[varname];
  };

  this.var_exists = function (varname) {
    return this.resolve_var(varname) !== undefined;
  };

  this.scalar_exists = function (varname) {
    let vinfo = this.resolve_var(varname);
    return vinfo !== undefined && vinfo.type === SCALAR;
  };

  this.array_exists = function (varname) {
    let vinfo = this.resolve_var(varname);
    return vinfo !== undefined && vinfo.type === ARRAY;
  };

  this.get_scalar = function (varname, makeUnshared) {
    let vinfo = this.resolve_var(varname);
    let obj;
    if (vinfo === undefined) {
      throw new TclError(`can't read "${varname}": no such variable`, [
        'TCL',
        'LOOKUP',
        'VARNAME',
        varname,
      ]);
    }
    if (vinfo.type === ARRAY) {
      throw new TclError(`can't read "${varname}": variable is array`, [
        'TCL',
        'READ',
        'VARNAME',
      ]);
    }
    obj = vinfo.value;
    if (makeUnshared && obj.refCount > 1) {
      obj = obj.DuplicateObj();
      vinfo.value.DecrRefCount();
      vinfo.value = obj;
      obj.IncrRefCount();
    }
    return obj;
  };

  this.get_array = function (array, index, makeUnshared) {
    let vinfo = this.resolve_var(array);
    let obj;
    if (vinfo === undefined) {
      throw new TclError(`can't read "${array}": no such variable`, [
        'TCL',
        'LOOKUP',
        'VARNAME',
        array,
      ]);
    }
    if (vinfo.type !== ARRAY) {
      throw new TclError(
        `can't read "${array}(${index})": variable isn't array`,
        ['TCL', 'LOOKUP', 'VARNAME', array],
      );
    }
    if (index !== undefined) {
      if (vinfo.value[index] === undefined) {
        throw new TclError(
          `can't read "${array}(${index})": no such element in array`,
          ['TCL', 'READ', 'VARNAME'],
        );
      }
      obj = vinfo.value[index];
      if (makeUnshared && obj.refCount > 1) {
        obj = obj.DuplicateObj();
        vinfo.value[index].DecrRefCount();
        vinfo.value[index] = obj;
        obj.IncrRefCount();
      }
      return obj;
    }
    return vinfo.value;
  };

  this.set_scalar = function (varname, value) {
    let vinfo = this.resolve_var(varname);
    if (vinfo === undefined) {
      vinfo = this.create_var(varname);
    }
    if (vinfo.type === ARRAY) {
      throw new TclError(`can't set "${varname}": variable is array`, [
        'TCL',
        'WRITE',
        'VARNAME',
      ]);
    }
    if (vinfo.value !== undefined) {
      vinfo.value.DecrRefCount();
    }
    vinfo.value = tclobj.AsObj(value);
    vinfo.value.IncrRefCount();
    return value;
  };

  this.set_array = function (array, index, value) {
    let vinfo = this.resolve_var(array);
    if (vinfo === undefined) {
      vinfo = this.create_var(array, '');
    }
    if (vinfo.type !== ARRAY) {
      throw new TclError(
        `can't set "${array}(${index})": variable isn't array`,
        ['TCL', 'LOOKUP', 'VARNAME', array],
      );
    }
    if (index) {
      if (vinfo.value[index] !== undefined) {
        vinfo.value[index].DecrRefCount();
      }
      vinfo.value[index] = tclobj.AsObj(value);
      vinfo.value[index].IncrRefCount();
    }
    return value;
  };

  function parseVarname(varname) {
    let array;
    let index;
    let idx;

    // TODO: properly
    idx = varname.lastIndexOf('(');
    array = varname.substr(0, idx);
    index = varname.substr(idx + 1, varname.length - idx - 2);

    return [array, index];
  }

  this.unset_var = function (varnameArg, reportErrors) {
    let parts;
    let vinfo;
    let varname = tclobj.AsVal(varnameArg);
    if (varname[varname.length - 1] === ')') {
      parts = parseVarname(varname);
      vinfo = this.resolve_var(parts[0]);
      if (
        reportErrors &&
        (vinfo === undefined || vinfo[parts[1]] === undefined)
      ) {
        throw new TclError(`can't unset "${varname}": no such variable`, [
          'TCL',
          'LOOKUP',
          'VARNAME',
        ]);
      }

      delete vinfo[parts[1]];
      return;
    }
    if (reportErrors && this.resolve_var(varname) === undefined) {
      throw new TclError(`can't unset "${varname}": no such variable`, [
        'TCL',
        'LOOKUP',
        'VARNAME',
      ]);
    }
    this.delete_var(varname);
  };

  this.get_var = function (varnameArg, makeUnshared) {
    let parts;
    let obj;
    let varname = tclobj.AsVal(varnameArg);
    if (varname[varname.length - 1] === ')') {
      parts = parseVarname(varname);
      return this.get_array(parts[0], parts[1], makeUnshared);
    }
    obj = this.get_scalar(varname, makeUnshared);
    return obj;
  };

  this.set_var = function (varnameArg, value) {
    let parts;
    let varname = tclobj.AsVal(varnameArg);
    if (varname[varname.length - 1] === ')') {
      parts = parseVarname(varname);
      return this.set_array(parts[0], parts[1], value);
    }
    return this.set_scalar(varname, value);
  };

  this.lookup_command = function (commandname) {
    return this.commands[commandname];
  };

  this.resolve_command = function (cmdObj) {
    let cinfo;
    if (cmdObj.cache.command === undefined) {
      cinfo = this.lookup_command(cmdObj);
      if (cinfo === undefined) {
        throw new TclError(`invalid command name "${cmdObj}"`);
      }
      cmdObj.cache.command = cinfo;
      cinfo.cacheRefs.push(() => {
        if (cmdObj && cmdObj.cache) {
          delete cmdObj.cache.command;
        }
      });
    } else {
      cinfo = cmdObj.cache.command;
    }

    return cinfo;
  };

  function registerCmd(async, commandname, handler, priv, onDelete) {
    let cinfo = I.lookup_command(commandname);
    if (cinfo !== undefined) {
      if (cinfo.onDelete) {
        cinfo.onDelete(cinfo.priv);
      }
      while (cinfo.cacheRefs.length > 0) {
        cinfo.cacheRefs.pop()();
      }
    } else {
      cinfo = {};
      I.commands[commandname] = {};
    }
    cinfo.handler = handler;
    cinfo.async = async;
    cinfo.priv = priv;
    cinfo.onDelete = onDelete;
    cinfo.cacheRefs = [];
  }

  this.registerCommand = function (commandname, handler, priv, onDelete) {
    return registerCmd(false, commandname, handler, priv, onDelete);
  };
  this.registerAsyncCommand = function (commandname, handler, priv, onDelete) {
    return registerCmd(true, commandname, handler, priv, onDelete);
  };

  this.checkArgs = function (args, count, msg) {
    let min;
    let max;
    if (count instanceof Array) {
      min = count[0];
      max = count[1] || 9007199254740992; // javascript maxint
    } else {
      min = count;
      max = count;
    }
    if (args.length - 1 < min || args.length - 1 > max) {
      throw new TclError(`wrong # args: should be "${args[0]} ${msg}"`, [
        'TCL',
        'WRONGARGS',
      ]);
    }
  };

  function resolveWord(tokens, cOk, cErr) {
    let parts = [];
    let expand = false;
    let array;
    let i = 0;

    function resolveIndex(indexwords) {
      let index = indexwords.join('');
      parts.push(I.get_array(array, index));
      array = null;
      return nextTokens;
    }

    function scriptResult(result) {
      if (result.code === OK) {
        parts.push(result.result);
        return nextTokens;
      }
      return cErr(result);
    }

    function nextTokens() {
      let res;
      let token;

      while (i < tokens.length) {
        token = tokens[i];
        i += 1;
        switch (token[0]) {
          case parser.EXPAND:
            expand = true;
            break;

          case parser.TEXT:
            parts.push(new StringObj(token[1]));
            break;

          case parser.ESCAPE:
            parts.push(new StringObj(token[2]));
            break;

          case parser.VAR:
            parts.push(I.get_scalar(token[1]));
            break;

          case parser.ARRAY:
            array = token[1];
            break;

          case parser.INDEX:
            return resolveWord(token[1], resolveIndex, cErr);

          case parser.SCRIPT:
            if (!(token[1] instanceof TclObject)) {
              token[1] = new ScriptObj([parser.SCRIPT, token[1].slice()]);
            }
            return I.exec(token[1], scriptResult);
          default:
        }
      }

      if (parts.length === 0) {
        return cOk([]);
      }
      if (parts.length > 1) {
        res = new StringObj(parts.join(''));
      } else {
        res = parts[0];
      }
      return cOk(expand ? tclobj.GetList(res) : [res]);
    }
    return nextTokens;
  }

  function execCommand(args, c) {
    let cinfo = I.resolve_command(args[0]);
    let result;
    let needsTrampoline = false;
    let asyncres;
    let i = args.length;

    while (i > 0) {
      i -= 1;
      args[i].IncrRefCount();
    }

    function normalizeResult(result2Arg) {
      let result2 = result2Arg;
      if (!(result2 instanceof TclResult)) {
        if (result2 instanceof TclError) {
          result2 = result2.toTclResult();
        } else if (result2 instanceof Error) {
          result2 = new TclResult(ERROR, new StringObj(result2));
        } else {
          result2 = new TclResult(OK, result2);
        }
      }
      return result2;
    }

    function gotResult(result2) {
      let j = args.length;
      while (j > 0) {
        j -= 1;
        args[j].DecrRefCount();
      }
      return c(normalizeResult(result2));
    }

    try {
      if (cinfo.async) {
        asyncres = cinfo.handler(
          (result2Arg) => {
            let result2 = result2Arg;
            try {
              while (typeof result2 === 'function') {
                // Support tailcalls
                result2 = result2();
              }
              if (!needsTrampoline) {
                return gotResult(result2);
              }
              return trampoline(gotResult(result2));
            } catch (e2) {
              return gotResult(asTclError(e2));
            }
          },
          args,
          I,
          cinfo.priv,
        );
        if (typeof asyncres !== 'function') {
          needsTrampoline = true;
        }
        return asyncres;
      }
      result = cinfo.handler(args, I, cinfo.priv);
      while (typeof result === 'function') {
        // Support tailcalls
        result = result();
      }
    } catch (e) {
      result = e;
    }
    return gotResult(result);
  }

  this.compile_script = function (commands) {
    let i;
    let j;
    let wordf;
    let command = [];
    let out = [];

    function compileWord(tokens) {
      let k;
      let token;
      let word = [];
      let async = false;
      let array;
      let expand = false;
      let constant = true;
      let constval = '';
      let f;
      let outtokens;
      let dyntokens;

      for (k = 0; k < tokens.length; k++) {
        token = tokens[k];
        switch (token[0]) {
          case parser.SCRIPT:
            word.push(scriptOp(token));
            if (constant) {
              constant = false;
            }
            async = true;
            break;

          case parser.INDEX:
            f = arrayOp(array, token[1]);
            word.push(f);
            if (!async && f.async) {
              async = true;
            }
            array = undefined;
            break;

          case parser.ARRAY:
            array = token[1];
            if (constant) {
              constant = false;
            }
            break;

          case parser.EXPAND:
            expand = true;
            break;

          case parser.TEXT:
            word.push(constantOp(token[1]));
            if (constant) {
              constval += token[1];
            }
            break;

          case parser.ESCAPE:
            word.push(constantOp(token[2]));
            if (constant) {
              constval += token[2];
            }
            break;

          case parser.VAR:
            word.push(scalarOp(token[1]));
            if (constant) {
              constant = false;
            }
            break;

          default:
            // console.log('stripping token: ', token.slice());
            break;
        }

        if (constant && async) {
          constant = false;
        }
      }
      if (word.length === 0) {
        return;
      }
      if (constant) {
        f = constantOp(new StringObj(constval));
      } else if (word.length === 1) {
        f = word[0];
      } else {
        outtokens = new Array(word.length);
        dyntokens = [];
        for (k = 0; k < word.length; k++) {
          if (word[k].constant) {
            outtokens[k] = word[k]();
          } else {
            dyntokens.push(k, word[k]);
          }
        }
        if (async) {
          f = function (c) {
            let l = 0;

            function setarg(m) {
              return function (v) {
                outtokens[m] = v;
                return loop;
              };
            }

            function loop() {
              let m;
              let fv;
              while (l < dyntokens.length) {
                m = dyntokens[l];
                l += 1;
                fv = dyntokens[l];
                l += 1;
                if (fv.async) {
                  return fv(setarg(m));
                }
                outtokens[m] = fv();
              }
              return c(new StringObj(outtokens.join('')));
            }
            return loop();
          };
          f.async = true;
        } else {
          f = function () {
            let l;
            for (l = 0; l < dyntokens.length; l += 2) {
              outtokens[dyntokens[l]] = dyntokens[l + 1]();
            }
            return new StringObj(outtokens.join(''));
          };
        }
      }
      f.expand = expand;
      return f;
    }

    function compileCommand(command2) {
      let k;
      let word;
      let expand = false;
      let async = false;
      let constant = true;
      let f;
      let dynwords = [];

      for (k = 0; k < command2.length; k++) {
        word = command2[k];
        if (!expand && word.expand) expand = true;
        if (!word.constant) {
          dynwords.push(k, word);
          if (constant) constant = false;
        }
        if (!async && word.async) async = true;
      }

      if (!expand) {
        let outwords = new Array(command2.length);
        for (k = 0; k < command2.length; k++) {
          if (command2[k].constant) {
            outwords[k] = command2[k]().replace(outwords[k]);
          }
        }
        if (constant) {
          return function (c) {
            return execCommand(outwords, c);
          };
        }
        if (async) {
          f = function (c) {
            let l = 0;

            function setarg(m) {
              return function (v) {
                outwords[m] = v;
                return loop;
              };
            }

            function loop() {
              let m;
              let fv;
              while (l < dynwords.length) {
                m = dynwords[l];
                l += 1;
                fv = dynwords[l];
                l += 1;
                if (fv.async) {
                  return fv(setarg(m));
                }
                outwords[m] = fv();
              }
              return execCommand(outwords, c);
            }
            return loop;
          };
          f.async = true;
          return f;
        }
        return function (c) {
          let l = 0;
          let m;
          let fv;
          while (l < dynwords.length) {
            m = dynwords[l];
            l += 1;
            fv = dynwords[l];
            l += 1;
            outwords[m] = fv();
          }
          return execCommand(outwords, c);
        };
      }

      // expand
      if (async) {
        f = function (c) {
          let words = [];
          let l = 0;

          function setarg(expand2) {
            if (expand2) {
              return function (v) {
                Array.prototype.push.apply(words, v.GetList());
                return loop;
              };
            }
            return function (v) {
              words.push(v);
              return loop;
            };
          }

          function loop() {
            let fv;
            while (l < command2.length) {
              fv = command2[l];
              l += 1;
              if (fv.async) {
                return fv(setarg(fv.expand));
              }
              if (fv.expand) {
                Array.prototype.push.apply(words, fv().GetList());
              } else {
                words.push(fv());
              }
            }
            return execCommand(words, c);
          }
          return loop();
        };
        f.async = true;
        return f;
      }
      return function (c) {
        let words = [];
        let l = 0;
        let fv;
        while (l < command2.length) {
          fv = command2[l];
          l += 1;
          if (fv.expand) {
            Array.prototype.push.apply(words, fv().GetList());
          } else {
            words.push(fv());
          }
        }
        return execCommand(words, c);
      };
    }

    for (i = 0; i < commands.length; i++) {
      command = [];
      for (j = 0; j < commands[i].length; j++) {
        wordf = compileWord(commands[i][j]);
        if (wordf !== undefined) {
          command.push(wordf);
        }
      }
      if (command.length) {
        out.push(compileCommand(command));
      }
    }
    return function (c) {
      let k = 0;
      let lastRes = EmptyResult;

      function gotRes(res) {
        lastRes = res;
        return res.code === OK ? nextCommand : c(res);
      }

      function nextCommand() {
        while (k < out.length) {
          let returnv = out[k](gotRes);
          k += 1;
          return returnv;
        }
        return c(lastRes);
      }
      return nextCommand();
    };
  };

  this.exec = function (script, c) {
    return tclobj.AsObj(script).GetExecParse(I)(c);
  };

  this.TclEval = function (script, c) {
    try {
      return trampoline(this.exec(script, c));
    } catch (e) {
      return c(asTclError(e).toTclResult());
    }
  };

  function notImplemented() {
    throw new Error('Not implemented yet');
  }

  function bignumNotImplemented() {
    throw new Error('Bignum support not implemented yet');
  }
  mathfuncs = {
    abs: 'abs',
    acos: 'acos',
    asin: 'asin',
    atan: 'atan',
    atan2: 'atan2',
    bool: {
      args: [1, 1],
      handler(args) {
        return [OPERAND, BOOL, utils.bool(args[0])];
      },
    },
    ceil: 'ceil',
    cos: 'cos',
    cosh: {
      args: [1, 1],
      handler: notImplemented,
    },
    double: {
      args: [1, 1],
      handler(args) {
        return [OPERAND, FLOAT, args[0]];
      },
    },
    entier: {
      args: [1, 1],
      handler: bignumNotImplemented,
    },
    exp: 'exp',
    floor: 'floor',
    fmod: {
      args: [2, 2],
      handler(args) {
        let a = args[0];
        let b = args[1];
        return a - Math.floor(a / b) * b;
      },
    },
    hypot: {
      args: [2, 2],
      handler(args) {
        let a = args[0];
        let b = args[1];
        // I don't think this exactly does what the Tcl hypot does
        return Math.sqrt(a * a + b * b);
      },
    },
    int: {
      args: [1, 1],
      handler(args) {
        return [OPERATOR, INTEGER, Math.floor(args[0])];
      },
    },
    isqrt: {
      args: [1, 1],
      handler: bignumNotImplemented,
    },
    log: 'log',
    log10: {
      args: [1, 1],
      handler: notImplemented,
    },
    max: 'max',
    min: 'min',
    pow: 'pow',
    rand: 'random', // Doesn't precisely match the bounds of the Tcl rand
    round: {
      args: [1, 1],
      handler(args) {
        return [OPERATOR, INTEGER, Math.round(args[0])];
      },
    },
    sin: 'sin',
    sinh: {
      args: [1, 1],
      handler: notImplemented,
    },
    sqrt: 'sqrt',
    srand: {
      args: [1, 1], // TODO: implement an RNG that can be seeded?
      handler() {},
    },
    tan: 'tan',
    tanh: {
      args: [1, 1],
      handler: notImplemented,
    },
    wide: {
      args: [1, 1],
      handler(args) {
        if (console) {
          console.warn("Javascript doesn't support 64bit integers");
        }
        return [OPERATOR, INTEGER, Math.floor(args[0])];
      },
    },
  };
  let mathfuncContracts = {
    // Flag functions that aren't const and sync here
    rand: {
      constant: false,
    },
    srand: {
      constant: false,
    },
  };
  mathops = {
    1: {
      '!': function (a) {
        return !utils.bool(a);
      },
      '~': '~',
      '-': '-',
      '+': function (a) {
        return a;
      },
    },
    2: {
      '*': '*',
      '/': '/',
      '%': '%',
      '+': '+',
      '-': '-',
      '<<': '<<',
      '>>': '>>',
      '**': function (a, b) {
        return a ** b;
      },
      '||': {
        compiler(args) {
          let f;
          let a = args[0];
          let b = args[1];
          if (a.constant) {
            return utils.bool(a()) ? a : b;
          }
          if (a.async) {
            f = b.async ?
              function (c) {
                return a(v => (utils.bool(v) ? c(v) : b(c)));
              } :
              function (c) {
                return a(v => (utils.bool(v) ? c(v) : c(b())));
              };
            f.async = true;
            return f;
          }
          f = b.async ?
            function (c) {
              let v = a();
              return utils.bool(v) ? c(v) : b(c);
            } :
            function () {
              let v = a();
              return utils.bool(v) ? v : b();
            };
          f.async = b.async;
          return f;
        },
      },
      '&&': {
        compiler(args) {
          let f;
          let a = args[0];
          let b = args[1];
          if (a.constant) {
            return utils.bool(a()) ? b : a;
          }
          if (a.async) {
            f = b.async ?
              function (c) {
                return a(v => (utils.bool(v) ? b(c) : c(v)));
              } :
              function (c) {
                return a(v => (utils.bool(v) ? c(b()) : c(v)));
              };
            f.async = true;
            return f;
          }
          f = b.async ?
            function (c) {
              let v = a();
              return utils.bool(v) ? b(c) : c(v);
            } :
            function () {
              let v = a();
              return utils.bool(v) ? b() : v;
            };
          f.async = b.async;
          return f;
        },
      },
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      '==': '==',
      '!=': '!=',
      eq(a, b) {
        return String(a) === String(b);
      },
      ne(a, b) {
        return String(a) !== String(b);
      },
      '&': '&',
      '^': '^',
      '|': '|',
      in(a, b) {
        // TODO: add compiler so that the case that b is const can be
        // optimized by building an object captured by a closure to
        // test using hasOwnProperty()
        let i;
        let l = tclobj.AsObj(b).GetList();
        for (i = 0; i < l.length; i++) {
          if (String(l[i]) === String(a)) {
            return true;
          }
        }
        return false;
      },
      ni(a, b) {
        let i;
        let l = tclobj.AsObj(b).GetList();
        for (i = 0; i < l.length; i++) {
          if (String(l[i]) === String(a)) {
            return false;
          }
        }
        return true;
      },
    },
    3: {
      '?': {
        compiler(args) {
          let f;
          let t = args[0];
          let a = args[1];
          let b = args[2];
          if (t.constant) {
            return utils.bool(t()) ? a : b;
          }
          if (t.async) {
            f = function (c) {
              return t(v => (utils.bool(v) ?
                a.async ?
                  a(c) :
                  c(a()) :
                b.async ?
                  b(c) :
                  c(b())));
            };
            f.async = true;
            return f;
          }
          if (a.async || b.async) {
            f = function (c) {
              return utils.bool(t()) ?
                a.async ?
                  a(c) :
                  c(a()) :
                b.async ?
                  b(c) :
                  c(b());
            };
            f.async = true;
            return f;
          }
          return function () {
            return utils.bool(t()) ? a() : b();
          };
        },
      },
    },
    any: {},
  };

  this.TclExpr = function (expr, c) {
    try {
      return trampoline(this._TclExpr(expr, c));
    } catch (e) {
      return c(asTclError(e).toTclResult());
    }
  };

  this._TclExpr = function (expr, c) {
    let f = compileExpr(expr);

    function gotVal(v) {
      switch (typeof v) {
        case 'boolean':
          return c(v ? TrueResult : FalseResult);
        case 'string':
          return c(new TclResult(OK, new StringObj(v)));
        case 'number':
          return c(new TclResult(OK, tclobj.NewObj('jsval', v)));
        default:
          return c(new TclResult(OK, tclobj.AsObj(v)));
      }
    }
    return f.async ? f(gotVal) : gotVal(f());
  };

  function checkTokens(tokens) {
    let i;
    let token;
    let async = false;
    let constant = true;
    let r;
    let constval = '';
    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];
      switch (token[0]) {
        case parser.TEXT:
          if (constant) {
            constval += token[1];
          }
          break;

        case parser.ESCAPE:
          if (constant) {
            constval += token[2];
          }
          break;

        case parser.EXPAND:
        case parser.VAR:
        case parser.ARRAY:
          constant = false;
          break;

        case parser.INDEX:
          r = checkTokens(token[1]);
          if (r.async) {
            async = true;
          }
          break;
        case parser.SCRIPT:
          async = true;
          constant = false;
          break;
        default:
      }
    }
    return {
      async,
      constant,
      constval: constant ? constval : undefined,
    };
  }

  function constantOp(operand) {
    let f = function () {
      return operand;
    };
    f.constant = true;
    return f;
  }

  function stringOp(tokens) {
    let f;
    let r = checkTokens(tokens);
    if (r.constant) {
      return constantOp(r.constval);
    }

    function err(errmsg) {
      throw new Error(`Error resolving quoted word: ${errmsg}`);
    }
    if (r.async) {
      f = function (c) {
        return resolveWord(
          tokens,
          chunks => (chunks.length === 1 ? c(chunks[0]) : c(chunks.join(''))),
          err,
        );
      };
    } else {
      f = function () {
        return trampoline(
          resolveWord(
            tokens,
            chunks => (chunks.length === 1 ? chunks[0] : chunks.join('')),
            err,
          ),
        );
      };
    }
    f.async = r.async;
    return f;
  }

  function scalarOp(varname) {
    return function () {
      return I.get_scalar(varname);
    };
  }

  function arrayOp(varname, indextokens) {
    let f;
    let index;
    let indexfunc;

    if (typeof indextokens === 'string') {
      index = indextokens;
      return function () {
        return I.get_array(varname, index);
      };
    }

    indexfunc = stringOp(indextokens);
    if (indexfunc.constant) {
      index = indexfunc();
      return function () {
        return I.get_array(varname, index);
      };
    }

    if (indexfunc.async) {
      f = function (c) {
        return indexfunc(index2 => c(I.get_array(varname, index2)));
      };
      f.async = true;
      return f;
    }
    return function () {
      return I.get_array(varname, indexfunc());
    };
  }

  function scriptOp(scriptArg) {
    let script = scriptArg;
    let f;
    if (script instanceof Array) {
      script = new ScriptObj(script);
    }
    f = function (c) {
      return I.exec(script, res => c(res.result));
    };
    f.async = true;
    return f;
  }

  function mathfuncOp(parts) {
    let part;
    let args = [];
    let arg;
    let i;
    let j = 0;
    let f;
    let async = false;
    let constant = true;
    let constval;
    let nativefunc;
    let outargs = [];
    let apply;
    let handler;
    let funcname = parts[0][3];
    let funcHandler = mathfuncs[funcname];

    for (i = 2; i < parts.length; i++) {
      // 0 is funcname, 1 is (
      part = parts[i];
      if (part[0] === ARG) {
        arg = part[1] === parser.EXPR ? compileExpr(part[2]) : constantOp(part[2]);

        if (!async && arg.async) {
          async = true;
        }
        if (arg.constant) {
          outargs.push(arg());
        } else {
          args.push(j, arg);
          outargs.push(undefined);
          if (constant) {
            constant = false;
          }
        }
        j += 1;
      }
    }

    // TODO: when we allow runtime definitions of math funcs, any change
    // to the math funcs must invalidate all the expr caches
    if (funcHandler === undefined) {
      // Not really true yet
      throw new TclError(`invalid command name "tcl::mathfunc::${funcname}"`);
    }

    if (funcHandler.args) {
      if (args.length < funcHandler.args[0]) {
        throw new TclError(`too few arguments to math function "${funcname}"`, [
          'TCL',
          'WRONGARGS',
        ]);
      }
      if (
        funcHandler.args[1] !== null &&
        outargs.length > funcHandler.args[1]
      ) {
        throw new TclError(
          `too many arguments to math function "${funcname}"`,
          ['TCL', 'WRONGARGS'],
        );
      }
    }

    if (mathfuncContracts[funcname]) {
      if (constant && mathfuncContracts[funcname].constant !== true) {
        constant = false;
      }
      if (!async && mathfuncContracts[funcname].async) {
        async = true;
      }
    }

    if (typeof funcHandler === 'string') {
      nativefunc = Math[funcHandler];
    } else {
      handler = funcHandler.handler;
    }

    if (constant) {
      if (nativefunc) {
        constval = nativefunc.apply(Math, outargs);
      } else {
        constval = handler(outargs, I, funcHandler.priv);
      }
      return constantOp(constval);
    }

    apply = nativefunc ?
      function () {
        return nativefunc.apply(Math, outargs);
      } :
      function () {
        return handler(outargs, I, funcHandler.priv);
      };

    if (async) {
      f = function (c) {
        let k = 0;

        function setarg(l) {
          return function (res) {
            outargs[l] = res;
            return loop;
          };
        }

        function loop() {
          let l;
          let argfunc;
          while (k < args.length) {
            l = args[k];
            k += 1;
            argfunc = args[k];
            k += 1;
            if (argfunc.async) return argfunc(setarg(l));
            outargs[l] = argfunc();
          }
          return c(apply());
        }
        return loop();
      };
    } else {
      f = function () {
        let k;
        for (k = 0; k < args.length; k += 2) {
          outargs[args[k]] = args[k + 1]();
        }
        return apply();
      };
    }
    f.async = async;
    return f;
  }

  function operand2func(operand) {
    if (!(operand instanceof Array)) {
      // debugger; // Shouldn't happen
      return constantOp(operand);
    }
    // console.log('resolving operand: ', operand.slice());
    switch (operand[1]) {
      case MATHFUNC:
        return mathfuncOp(operand[2]);
      case INTEGER:
      case FLOAT:
      case BOOL:
        return constantOp(operand[2]);
      case BRACED:
      case QUOTED:
        return stringOp(operand[2]);
      case VAR:
        return operand[2].length === 1 ?
          scalarOp(operand[2][0]) :
          arrayOp(operand[2][0], operand[2][1]);
      case SCRIPT:
        return scriptOp(operand[2]);
      default:
        throw new Error(`Unexpected operand type: ${operand[1]}`);
    }
  }

  function operator2func(name, args) {
    let takes = args.length;
    let mathop = mathops[takes][name];
    let cached;
    let f;
    let i;
    let constant = true;
    let async = false;
    let outargs;
    let dynargs;
    let apply;

    if (mathop === undefined) {
      throw new TclError(`Invalid operator "${name}"`);
    }

    if (typeof mathop === 'string') {
      cached = mathopCache[takes];
      if (cached[name] === undefined) {
        /* jslint evil: true */
        if (takes === 1) {
          cached[name] = new Function('a', `return ${mathop} a;`);
        } else {
          cached[name] = new Function('a', 'b', `return a ${mathop} b;`);
        }
        /* jslint evil: false */
      }
      mathop = cached[name];
    }

    if (mathop.compiler) return mathop.compiler(args);

    outargs = new Array(args.length);
    dynargs = [];
    for (i = 0; i < args.length; i++) {
      if (args[i].constant) {
        outargs[i] = args[i]();
      } else {
        outargs[i] = undefined;
        dynargs.push(i, args[i]);
        if (constant) constant = false;
        if (!async && args[i].async) async = true;
      }
    }

    if (constant) return constantOp(mathop(...outargs));

    switch (args.length) {
      case 1:
        apply = function () {
          return mathop(outargs[0]);
        };
        break;
      case 2:
        apply = function () {
          return mathop(outargs[0], outargs[1]);
        };
        break;
      case 3:
        apply = function () {
          return mathop(outargs[0], outargs[1], outargs[2]);
        };
        break;
      default:
        throw new TclError(
          `Operator "${name}" received incorrect number of arguments: ${
            args.length
          }`,
        );
    }

    if (async) {
      f = function (c) {
        let k = 0;

        function setarg(j) {
          return function (v) {
            outargs[j] = v;
            return loop;
          };
        }

        function loop() {
          let j;
          let fv;
          while (k < dynargs.length) {
            j = dynargs[k];
            k += 1;
            fv = dynargs[k];
            k += 1;
            if (fv.async) return fv(setarg(j));
            outargs[j] = fv();
          }
          return c(apply());
        }
        return loop();
      };
    } else {
      f = function () {
        let k;
        for (k = 0; k < dynargs.length; k += 2) {
          outargs[dynargs[k]] = dynargs[k + 1]();
        }
        return apply();
      };
    }
    f.async = async;
    return f;
  }

  function compileExpr(expr) {
    let exprObj = expr instanceof TclObject ? expr : new ExprObj(expr);
    let f = exprObj.cache.expr_f;
    let P;
    let i;
    let numargs;
    let stack;
    let thisP;
    let args;

    if (f) return f;

    P = exprObj.GetExprStack();

    stack = [];
    for (i = 0; i < P.length; i++) {
      thisP = P[i];
      switch (thisP[0]) {
        case OPERAND:
          stack.push(operand2func(thisP));
          break;
        case OPERATOR:
          if (thisP[3] === ':') {
            // Hack around the expr ? val : val syntax
            // stack.pop();
            break;
          }
          numargs = thisP[2];
          args = stack.splice(-numargs, numargs);
          stack.push(operator2func(thisP[3], args));
          break;
        default:
      }
    }

    f = stack.pop();
    if (stack.length) {
      throw new Error(`Expr stack not empty at end of compile: ${stack}`);
    }
    if (f === undefined) {
      f = function () {
        return '';
      };
    }
    exprObj.cache.expr_f = f;
    return f;
  }
  this.compile_expr = compileExpr;

  this.TclError = TclError;
  this.TclResult = TclResult;
  this.tclobj = tclobj;
  this.EmptyResult = EmptyResult;
  this.types = types;

  this.register_extension = function (ex) {
    if (this.extensions[ex] === undefined) {
      this.extensions[ex] = true;
      return false;
    }
    return true;
  };

  this.override = function (fn, newImplmentation) {
    I[fn] = newImplmentation;
  };

  (function () {
    let i;
    // Load the extensions
    for (i = 0; i < interpArgs.length; i++) {
      interpArgs[i].install(this);
    }
  }());
};
