const types = require('./types');
const utils = require('./utils');
const tclobj = require('./tclobject');
const DictObj = require('./objtype_dict');
const ListObj = require('./objtype_list');

let { TclError } = types;

function makeUnshared(dictval, key) {
  if (dictval[key].IsShared()) {
    let tmp = dictval[key].DuplicateObj();
    dictval[key].DecrRefCount();
    dictval[key] = tmp;
    dictval[key].IncrRefCount();
  }
}

function resolveKeypath(I, dictobjArg, keys, createArg, dictvar) {
  let create = createArg;
  let dictobj = dictobjArg;
  let key;
  let lastdict;
  let lastdictobj;
  let root;
  if (create === undefined) {
    create = false;
  }
  if (dictvar !== undefined && dictobj.IsShared()) {
    dictobj = I.get_var(dictvar, true);
  }
  lastdict = dictobj;
  root = dictobj;
  while (keys.length > 0) {
    if (dictvar !== undefined && dictobj.IsShared()) {
      dictobj = dictobj.DuplicateObj();
      lastdict[key].DecrRefCount();
      lastdict[key] = dictobj;
      lastdict[key].IncrRefCount();
    }
    key = keys.shift();
    lastdict = dictobj.GetDict();
    lastdictobj = dictobj;
    if (lastdict[key] === undefined) {
      if (create === true) {
        dictobj.InvalidateCaches();
        lastdict[key] = new DictObj();
        lastdict[key].IncrRefCount();
      } else if (keys.length > 0) {
        throw new TclError(`key "${key}" not known in dictionary`, [
          'TCL',
          'LOOKUP',
          'DICT',
          key,
        ]);
      }
    }
    dictobj = lastdict[key];
  }
  return {
    root,
    key,
    lastdict,
    lastdictobj,
    value: dictobj,
  };
}

let subcmds = {};
subcmds.append = (c, args, I) => {
  I.checkArgs(args, [3, null], 'dictionaryVariable key ?string ...?');
  args.shift();
  let dictvar = args.shift();
  let dictobj = I.get_var(dictvar, true);
  let dictval;
  let key = args.shift();
  let strings = args;
  let newval;

  dictval = dictobj.GetDict();
  dictobj.InvalidateCaches();

  if (dictval[key] !== undefined) {
    newval = dictval[key].toString() + strings.join('');
    dictval[key].DecrRefCount();
  } else {
    newval = strings.join('');
  }
  dictval[key] = tclobj.NewObj(newval);
  dictval[key].IncrRefCount();
  return c(dictobj);
};
subcmds.create = (c, args) => c(new DictObj(args.slice(1)));
subcmds.exists = (c, args, I) => {
  I.checkArgs(args, [2, null], 'dictionaryValue key ?key ...?');
  args.shift();
  let dictobj = args.shift();
  let keys = args;
  let kinfo = resolveKeypath(I, dictobj, keys);
  return c(kinfo.lastdict[kinfo.key] !== undefined);
};
subcmds.filter = (c, args, I) => {
  I.checkArgs(args, [2, null], 'dictionaryValue filterType arg ?arg ...?');
  args.shift();
  let dictobj = args.shift();
  let dictvals = dictobj.GetDict();
  let out = new DictObj();
  let outdictvals = out.GetDict();
  let filterType = args.shift();

  function filterKey() {
    let regexes = [];
    let i;
    let j;
    let keys = utils.objkeys(dictvals);
    let key;
    let re;
    for (i = 0; i < args.length; i++) {
      regexes.push(utils.glob2regex(args[i]));
    }
    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      for (j = 0; j < regexes.length; j++) {
        re = regexes[j];
        if (re.test(key)) {
          outdictvals[key] = dictvals[key];
          outdictvals[key].IncrRefCount();
          break;
        }
      }
    }
    return c(out);
  }

  function filterScript() {
    let loopvars = args[0].GetList();
    let body = args[1];
    let keyvar;
    let valuevar;
    let pairs = [];
    let i = 0;
    I.checkArgs(args, 2, 'dictionaryValue script {keyVar valueVar} script');
    if (loopvars.length !== 2) {
      throw new TclError('must have exactly two variable names');
    }
    keyvar = loopvars[0];
    valuevar = loopvars[1];
    for (let j = 0; j < Object.keys(dictvals).length; j++) {
      let e = Object.keys(dictvals)[j];
      if (Object.prototype.hasOwnProperty.call(dictvals, e)) {
        pairs.push(e, dictvals[e]);
      }
    }

    return function nextLoop() {
      if (i >= pairs.length) {
        return c(out);
      }
      let k = pairs[i];
      i += 1;
      let v = pairs[i];
      i += 1;

      I.set_scalar(keyvar, k);
      I.set_scalar(valuevar, v);
      return I.exec(body, (res) => {
        switch (res.code) {
          case types.OK:
            if (utils.bool(res.result.toString())) {
              outdictvals[k] = dictvals[k];
              outdictvals[k].IncrRefCount();
            }
            return nextLoop;
          case types.RETURN:
            return c(res);
          case types.BREAK:
            return c(out);
          case types.CONTINUE:
            return nextLoop;
          case types.ERROR:
            return c(res);
          default:
            return c(new TclError(`Unhandled return code (${res.code})`));
        }
      });
    };
  }

  function filterValue() {
    let regexes = [];
    let i;
    let j;
    let keys = utils.objkeys(dictvals);
    let key;
    let re;
    for (i = 0; i < args.length; i++) {
      regexes.push(utils.glob2regex(args[i]));
    }
    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      for (j = 0; j < regexes.length; j++) {
        re = regexes[j];
        if (re.test(dictvals[key])) {
          outdictvals[key] = dictvals[key];
          outdictvals[key].IncrRefCount();
          break;
        }
      }
    }
    return c(out);
  }
  switch (filterType) {
    case 'key':
      return filterKey();
    case 'script':
      return filterScript();
    case 'value':
      return filterValue();
    default:
      throw new TclError(
        `bad filterType "${filterType}": must be key, script, or value`,
        ['TCL', 'LOOKUP', 'INDEX', 'filterType', filterType],
      );
  }
};
subcmds.for = (c, args, I) => {
  I.checkArgs(args, 3, '{keyVar valueVar} dictionary script');
  let loopvars = args[1].GetList();
  let dictval = args[2].GetDict();
  let body = args[3];
  let keyvar;
  let valuevar;
  let pairs = [];
  let i = 0;
  if (loopvars.length !== 2) {
    throw new TclError('must have exactly two variable names');
  }
  keyvar = loopvars[0];
  valuevar = loopvars[1];

  for (let j = 0; j < Object.keys(dictval).length; j++) {
    let e = Object.keys(dictval)[j];
    if (Object.prototype.hasOwnProperty.call(dictval, e)) {
      pairs.push(e);
      pairs.push(dictval[e]);
    }
  }

  return function nextLoop() {
    if (i === pairs.length) {
      return c();
    }
    let k = pairs[i];
    i += 1;
    let v = pairs[i];
    i += 1;

    I.set_scalar(keyvar, k);
    I.set_scalar(valuevar, v);
    return I.exec(body, (res) => {
      switch (res.code) {
        case types.CONTINUE:
        case types.OK:
          return nextLoop;
        case types.BREAK:
          return c();
        case types.ERROR:
          return c(res);
        default:
      }
    });
  };
};
subcmds.get = (c, args, I) => {
  I.checkArgs(args, [1, null], 'dictionaryValue ?key ...?');
  args.shift();
  let dictobj = args.shift();
  let keys = args;
  let kinfo = resolveKeypath(I, dictobj, keys);
  if (kinfo.value === undefined) {
    throw new TclError(`key "${kinfo.key}" not known in dictionary`, [
      'TCL',
      'LOOKUP',
      'DICT',
      kinfo.key,
    ]);
  }
  return c(kinfo.value);
};
subcmds.incr = (c, args, I) => {
  I.checkArgs(args, [2, 3], 'dictionaryVariable key ?increment?');
  let dictvar = args[1];
  let dictobj = I.get_var(dictvar, true);
  let dictval = dictobj.GetDict();
  let key = args[2];
  let increment = Number(args[3]) || 1;
  dictobj.InvalidateCaches();
  makeUnshared(dictval, key);
  dictval[key].GetInt();
  dictval[key].jsval += increment;
  return c(dictval[key]);
};
subcmds.info = c => c('Nothing interesting to report');
subcmds.keys = (c, args, I) => {
  I.checkArgs(args, [1, 2], 'dictionaryValue ?globPattern?');
  args.shift();
  let dictobj = args.shift();
  let glob = args.shift();
  let re;
  let i;
  let keys = utils.objkeys(dictobj.GetDict());
  let out;

  if (glob !== undefined) {
    re = utils.glob2regex(glob.toString());
    out = [];
    for (i = 0; i < keys.length; i++) {
      if (re.test(keys[i])) {
        out.push(keys[i]);
      }
    }
  } else {
    out = keys;
  }
  return c(out);
};
subcmds.lappend = (c, args, I) => {
  I.checkArgs(args, [2, null], 'dictionaryVariable key ?value ...?');
  args.shift();
  let dictvar = args.shift();
  let dictobj = I.get_var(dictvar, true);
  let dictval = dictobj.GetDict();
  let key = args.shift();
  let values = args;
  let newlist;
  dictobj.InvalidateCaches();
  if (dictval[key] === undefined) {
    dictval[key] = new ListObj();
    dictval[key].IncrRefCount();
  }
  makeUnshared(dictval, key);
  newlist = dictval[key].GetList().concat(values);
  dictval[key].InvalidateCaches();
  dictval[key].jsval = newlist;
  return c(dictobj);
};
subcmds.map = (c, args, I) => {
  I.checkArgs(args, 3, '{keyVar valueVar} dictionary script');
  let loopvars = args[1].GetList();
  let dictval = args[2].GetDict();
  let body = args[3];
  let keyvar;
  let valuevar;
  let pairs = [];
  let accum = [];
  let i = 0;

  if (loopvars.length !== 2) {
    throw new TclError('must have exactly two variable names');
  }
  keyvar = loopvars[0];
  valuevar = loopvars[1];

  for (let j = 0; j < Object.keys(dictval).length; j++) {
    let e = Object.keys(dictval)[j];
    if (Object.prototype.hasOwnProperty.call(dictval, e)) {
      pairs.push(e);
      pairs.push(dictval[e]);
    }
  }

  return function nextLoop() {
    if (i >= pairs.length) {
      return c(accum);
    }
    let k = pairs[i];
    i += 1;
    let v = pairs[i];
    i += 1;

    I.set_scalar(keyvar, k);
    I.set_scalar(valuevar, v);
    return I.exec(body, (res) => {
      switch (res.code) {
        case types.OK:
          accum.push(res.result);
          return nextLoop;
        case types.BREAK:
          return c(accum);
        case types.CONTINUE:
          return nextLoop;
        case types.ERROR:
          return c(res);
        default:
          return c(new TclError(`Unexpected result code: (${res.code})`));
      }
    });
  };
};
subcmds.merge = (c, args) => {
  let out = {};
  let dictval;
  let arg;
  args.shift();
  while (args.length) {
    arg = args.shift();
    dictval = arg.GetDict();
    for (let j = 0; j < Object.keys(dictval).length; j++) {
      let e = Object.keys(dictval)[j];
      if (Object.prototype.hasOwnProperty.call(dictval, e)) {
        out[e] = dictval[e];
      }
    }
  }
  return c(new DictObj(out));
};
subcmds.remove = (c, args, I) => {
  I.checkArgs(args, [1, null], 'dictionaryValue ?key ...?');
  args.shift();
  let dictobj = args.shift();
  let keys = args;
  let dictval;
  let i;
  if (keys.length === 0) {
    return c(dictobj);
  }
  dictobj = dictobj.DuplicateObj();
  dictval = dictobj.GetDict();
  dictobj.InvalidateCaches();
  for (i = 0; i < keys.length; i++) {
    if (Object.prototype.hasOwnProperty.call(dictval, keys[i])) {
      dictval[keys[i]].DecrRefCount();
      delete dictval[keys[i]];
    }
  }
  return c(dictobj);
};
subcmds.replace = (c, args, I) => {
  I.checkArgs(args, [1, null], 'dictionaryValue ?key value ...?');
  args.shift();
  let dictobj = args.shift();
  let pairs = args;
  let i;
  let key;
  let val;
  let dictval;
  if (pairs.length === 0) {
    return c(dictobj);
  }
  if (pairs.length % 2 !== 0) {
    throw new TclError(
      'wrong # args: should be "dict replace dictionary ?key value ...?"',
      ['TCL', 'WRONGARGS'],
    );
  }
  dictobj = dictobj.DuplicateObj();
  dictval = dictobj.GetDict();
  dictobj.InvalidateCaches();
  for (i = 0; i < pairs.length; i += 2) {
    key = pairs[i];
    val = pairs[i + 1];
    if (dictval[key] !== undefined) {
      dictval[key].DecrRefCount();
    }
    dictval[key] = val;
    dictval[key].IncrRefCount();
  }
  return c(dictobj);
};
subcmds.set = (c, args, I) => {
  I.checkArgs(args, [3, null], 'dictionaryVariable key ?key ...? value');
  args.shift();
  let dictvar = args.shift();
  let dictobj = I.get_var(dictvar);
  let keys = args.slice(0, args.length - 1);
  let value = args[args.length - 1];
  let kinfo;

  kinfo = resolveKeypath(I, dictobj, keys, true, dictvar);
  kinfo.root.InvalidateCaches();

  if (kinfo.lastdict[kinfo.key] !== undefined) {
    kinfo.lastdict[kinfo.key].DecrRefCount();
  }
  kinfo.lastdict[kinfo.key] = tclobj.AsObj(value);
  kinfo.lastdict[kinfo.key].IncrRefCount();
  return c(kinfo.root);
};
subcmds.size = (c, args, I) => {
  I.checkArgs(1, 'dictionaryValue');
  return c(utils.objkeys(args[1].GetDict()).length);
};
subcmds.unset = (c, args, I) => {
  I.checkArgs(args, [3, null], 'dictionaryVariable key ?key ...? value');
  args.shift();
  let dictvar = args.shift();
  let dictobj = I.get_var(dictvar, true);
  let keys = args;
  let kinfo;

  kinfo = resolveKeypath(I, dictobj, keys, false, dictvar);
  if (kinfo.lastdict[kinfo.key] !== undefined) {
    kinfo.lastdictobj.InvalidateCaches();
    kinfo.lastdict[kinfo.key].DecrRefCount();
    delete kinfo.lastdict[kinfo.key];
  }
  return c(kinfo.root);
};
subcmds.update = (c, args, I) => {
  I.checkArgs(
    args,
    [4, null],
    'dictionaryVariable key varName ?key Varname ...? body',
  );
  args.shift();
  let dictvar = args.shift();
  let dictobj = I.get_var(dictvar);
  let pairs = args.slice(0, args.length - 1);
  let body = args[args.length - 1];
  let dictval;
  let vars;
  let i;
  if (pairs.length % 2 !== 0) {
    throw new TclError(
      'wrong # args: should be "dict update varName key varName ?key varName ...? script"',
      ['TCL', 'WRONGARGS'],
    );
  }
  dictval = dictobj.GetDict();
  for (i = 0; i < pairs.length; i += 2) {
    I.set_scalar(pairs[i + 1], dictval[pairs[i]]);
  }

  function applyUpdates() {
    let j;
    let dictobj2;
    let dictval2;
    let varname;
    let key;
    try {
      dictobj2 = I.get_var(dictvar);
    } catch (e) {
      if (
        e instanceof types.TclError &&
        /^TCL LOOKUP (DICT)|(VARNAME) /.test(e.errorcode.join(' '))
      ) {
        return;
      }
      throw e;
    }
    if (dictobj2.IsShared()) {
      dictobj2 = dictobj2.DuplicateObj();
      I.set_var(dictvar, dictobj2);
    }
    dictval2 = dictobj2.GetDict();
    dictobj2.InvalidateCaches();
    for (j = 0; j < pairs.length; j += 2) {
      key = vars[j];
      varname = vars[j + 1];
      if (dictval2[key] !== undefined) {
        dictval2[key].DecrRefCount();
        delete dictval2[key];
      }
      if (I.scalar_exists(varname)) {
        dictval2[key] = I.get_scalar(varname);
        dictval2[key].IncrRefCount();
      }
    }
  }

  return I.exec(body, (resArg) => {
    let res = resArg;
    try {
      applyUpdates();
    } catch (e2) {
      res = e2 instanceof TclError ? e2 : new TclError(e2);
    }
    return c(res);
  });
};
subcmds.values = (c, args, I) => {
  I.checkArgs(args, [1, 2], 'dictionaryValue ?globPattern?');
  args.shift();
  let dictobj = args.shift();
  let dictval = dictobj.GetDict();
  let glob = args.shift();
  let re;
  let i;
  let keys = utils.objkeys(dictval);
  let out;

  if (glob !== undefined) {
    re = utils.glob2regex(glob.toString());
    out = [];
    for (i = 0; i < keys.length; i++) {
      if (re.test(keys[i])) {
        out.push(dictval[keys[i]]);
      }
    }
  } else {
    out = [];
    for (let j = 0; j < Object.keys(dictval).length; j++) {
      let e = Object.keys(dictval)[j];
      if (Object.prototype.hasOwnProperty.call(dictval, e)) {
        out.push(dictval[e]);
      }
    }
  }
  return c(new ListObj(out));
};
subcmds.with = (c, args, I) => {
  I.checkArgs(args, [2, null], 'dictionaryVariable ?key ...? body');
  args.shift();
  let dictvar = args.shift();
  let dictobj = I.get_var(dictvar);
  let keys = args.slice(0, args.length - 1);
  let body = args[args.length - 1];
  let dictval;
  let vars;
  let i;
  let kinfo;
  kinfo = resolveKeypath(I, dictobj, keys, false, dictvar);
  dictobj = kinfo.value;
  dictval = dictobj.GetDict();
  vars = utils.objkeys(dictval);
  for (i = 0; i < vars.length; i++) {
    I.set_scalar(vars[i], dictval[vars[i]]);
  }

  function applyUpdates() {
    let j;
    let dictobj2;
    let dictval2;
    let varname;
    try {
      dictobj2 = I.get_var(dictvar);
      kinfo = resolveKeypath(I, dictobj2, keys, false, dictvar);
    } catch (e) {
      if (
        e instanceof types.TclError &&
        /^TCL LOOKUP (DICT)|(VARNAME) /.test(e.errorcode.join(' '))
      ) {
        return;
      }
      throw e;
    }
    dictobj2 = kinfo.value;
    dictval2 = dictobj2.GetDict();
    dictobj2.InvalidateCaches();
    for (j = 0; j < vars.length; j++) {
      varname = vars[j];
      if (dictval2[varname] !== undefined) {
        dictval2[varname].DecrRefCount();
        delete dictval2[varname];
      }
      if (I.scalar_exists(varname)) {
        dictval2[varname] = I.get_scalar(varname);
        dictval2[varname].IncrRefCount();
      }
    }
  }

  return I.exec(body, (resArg) => {
    let res = resArg;
    try {
      applyUpdates();
    } catch (e2) {
      res = e2 instanceof TclError ? e2 : new TclError(e2);
    }
    return c(res);
  });
};

function install(interp) {
  if (interp.register_extension('ex_dict_cmds')) {
    return;
  }

  interp.registerAsyncCommand('dict', (c, args) => {
    let subcmd;
    let fakeargs = args.slice(1);
    if (args.length < 2) {
      interp.checkArgs(args, 1, 'subcmd args');
    }

    subcmd = args[1];
    fakeargs[0] = `${args[0]} ${subcmd}`;
    if (subcmds[subcmd] === undefined) {
      throw new TclError(
        `unknown or ambiguous subcommand "${subcmd}": must be ${utils
          .objkeys(subcmds)
          .join(', ')}`,
        ['TCL', 'LOOKUP', 'SUBCOMMAND', subcmd],
      );
    }
    return subcmds[subcmd](c, fakeargs, interp);
  });
}

module.exports = {
  install,
};
