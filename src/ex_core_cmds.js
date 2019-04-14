const exCallframes = require('./ex_callframes');
const exControlCmds = require('./ex_control_cmds');
const exListCmds = require('./ex_list_cmds');
const exDictCmds = require('./ex_dict_cmds');
const exStringCmds = require('./ex_string_cmds');
const exArrayCmds = require('./ex_array_cmds');
const exClockCmds = require('./ex_clock_cmds');
const types = require('./types');
const IntObj = require('./objtype_int');

let { TclResult } = types;
let { TclError } = types;
let codeOkObj = new IntObj(types.OK);

function install(interp) {
  if (interp.register_extension('ex_core_cmds')) {
    return;
  }

  /* Core commands still to implement:
   * after binary clock coroutine format global info interp
   * namespace package regexp regsub rename scan subst tailcall time trace
   * update uplevel upvar variable vwait yield zlib
   */

  interp.registerCommand('set', (args) => {
    interp.checkArgs(args, [1, 2], 'varName ?newValue?');
    if (args.length === 2) {
      return interp.get_var(args[1]);
    }
    return interp.set_var(args[1], args[2]);
  });

  interp.registerCommand('unset', (args) => {
    let eatingArgs = true;
    let reportErrors = true;
    while (eatingArgs && args.length > 0) {
      switch (args[0].toString()) {
        case '-nocomplain':
          reportErrors = false;
          args.shift();
          break;
        case '--':
          eatingArgs = false;
          args.shift();
          break;
        default:
      }
    }
    for (let i = 0; i < args.length; i++) {
      interp.unset_var(args[i], reportErrors);
    }
  });

  interp.registerAsyncCommand('catch', (callback, args) => {
    interp.checkArgs(args, [1, 3], 'script ?resultVarName? ?optionsVarName?');
    let resultvar = args[2];
    let optionsvar = args[3];
    return interp.exec(args[1], (res) => {
      if (resultvar !== undefined) {
        interp.set_var(resultvar, res.result);
      }
      if (optionsvar !== undefined) {
        interp.set_var(optionsvar, res.options);
      }
      return callback(new IntObj(res.code));
    });
  });

  interp.registerAsyncCommand('expr', (callback, args) => {
    interp.checkArgs(args, [1, null], 'arg ?arg ...?');
    if (args.length === 2) {
      return interp._TclExpr(args[1], callback);
    }
    let i;
    let strArgs = [];
    for (i = 1; i < args.length; i++) {
      strArgs.push(args.toString());
    }
    return interp._TclExpr(strArgs.join(' '), callback);
  });

  interp.registerCommand('incr', (args) => {
    interp.checkArgs(args, [1, 2], 'varname ?increment?');
    let intobj;
    let increment = args[2] === undefined ? 1 : args[2].GetInt();

    if (!interp.var_exists(args[1])) {
      interp.set_var(args[1], new IntObj(0));
    }
    intobj = interp.get_var(args[1], true);

    intobj.jsval = intobj.GetInt() + increment;
    intobj.InvalidateCaches();
    return intobj;
  });

  interp.registerCommand('return', (args) => {
    let i = 1;
    let k;
    let v;
    let options = [];
    let code;
    let mycode;
    let value;
    let level;

    if ((args.length - 1) % 2 === 1) {
      value = args.pop();
    } else {
      value = types.EmptyString;
    }
    while (i < args.length) {
      k = args[i];
      i += 1;
      v = args[i];
      i += 1;
      options.push(k, v);
      if (k === '-code') {
        code = types.lookup_code(v);
      } else if (k === '-level') {
        level = v;
      }
    }
    if (level === undefined) {
      level = types.IntOne;
      options.push('-level', level);
    }
    if (code === undefined) {
      code = codeOkObj;
      options.push('-code', code);
    }
    if (level.GetInt() === 0) {
      mycode = code.GetInt();
    } else {
      mycode = types.RETURN;
    }
    return new TclResult(mycode, value, options, level, code);
  });

  interp.registerAsyncCommand('eval', (callback, args) => {
    let parts = [];
    let i;
    for (i = 1; i < args.length; i++) {
      parts.push(/^[ \t\n\r]*(.*?)[ \t\n\r]*$/.exec(args[i].toString())[1]);
    }
    return interp.exec(parts.join(' '), callback);
  });

  interp.registerCommand('append', (args) => {
    interp.checkArgs(args, [1, null], 'varName ?value ...?');
    let parts = [];
    let obj;
    let varname = args[1].toString();
    let vinfo = interp.resolve_var(varname);

    if (vinfo === undefined) {
      vinfo = interp.create_var(varname);
    }
    if (vinfo.type !== types.SCALAR) {
      throw new TclError(`can't set "${varname}": variable is array`, [
        'TCL',
        'WRITE',
        'VARNAME',
      ]);
    }
    if (vinfo.value.IsShared()) {
      obj = vinfo.value.DuplicateObj();
      vinfo.value.DecrRefCount();
      vinfo.value = obj;
      obj.IncrRefCount();
    }
    for (let i = 2; i < args.length; i++) {
      parts.push(args[i].toString());
    }
    vinfo.value.ConvertToType('string');
    vinfo.value.jsval += parts.join('');
    vinfo.value.InvalidateCaches();
    return vinfo.value;
  });

  exCallframes.install(interp);
  exControlCmds.install(interp);
  exListCmds.install(interp);
  exDictCmds.install(interp);
  exStringCmds.install(interp);
  exArrayCmds.install(interp);
  exClockCmds.install(interp);
}

module.exports = {
  install,
};
