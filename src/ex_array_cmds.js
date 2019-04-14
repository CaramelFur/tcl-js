const utils = require('./utils');
const tclobj = require('./tclobject');
const BoolObj = require('./objtype_bool');
const ListObj = require('./objtype_list');
const IntObj = require('./objtype_int');
const types = require('./types');

let { TclError } = types;
let { ARRAY } = types;

let subcmds = {};

subcmds.exists = (args, I) => {
  I.checkArgs(args, 1, 'arrayName');
  return new BoolObj(I.array_exists(args[1]));
};

subcmds.get = (args, I) => {
  I.checkArgs(args, [1, 2], 'arrayName ?pattern?');
  let vinfo = I.resolve_var(args[1]);
  let res = [];
  let a;
  let pattern;

  if (vinfo === undefined || vinfo.type === ARRAY) {
    return I.EmptyResult;
  }

  a = vinfo.value;
  if (args[2] === undefined) {
    for (let i = 0; i < Object.keys(a).length; i++) {
      let e = Object.keys(a)[i];
      if (Object.prototype.hasOwnProperty.call(a, e)) {
        res.push(e, a[e]);
      }
    }
  } else {
    pattern = utils.glob2regex(args[2]);
    for (let i = 0; i < Object.keys(a).length; i++) {
      let e = Object.keys(a)[i];
      if (Object.prototype.hasOwnProperty.call(a, e) && pattern.test(e)) {
        res.push(e, a[e]);
      }
    }
  }

  return new ListObj(res);
};

subcmds.names = (args, I) => {
  I.checkArgs(args, [1, 3], 'arrayName ?mode? ?pattern?');
  let vinfo = I.resolve_var(args[1]);
  let res = [];
  let a;
  let mode;
  let pattern;

  if (vinfo === undefined || vinfo.type === ARRAY) {
    return I.EmptyResult;
  }

  if (args.length >= 2) {
    mode = args[2].toString();
  } else {
    mode = '-glob';
  }

  if (args.length >= 3) {
    switch (mode) {
      case 'glob':
        pattern = utils.glob2regex(args[3]);
        break;
      case 'exact':
        pattern = utils.escape_regex(args[3]);
        break;
      case 'regex':
        if (args[3].cache.regex === undefined) {
          args[3].cache.regex = new RegExp(args[3].toString());
        }
        pattern = args[3].cache.regex;
        break;
      default:
        throw new TclError(
          `bad option "${args[2]}": must be -exact, -glob, or -regexp`,
          ['TCL', 'LOOKUP', 'INDEX'],
        );
    }
  }

  a = vinfo.value;
  if (pattern === undefined) {
    for (let i = 0; i < Object.keys(a).length; i++) {
      let e = Object.keys(a)[i];
      if (Object.prototype.hasOwnProperty.call(a, e)) {
        res.push(e);
      }
    }
  } else {
    for (let i = 0; i < Object.keys(a).length; i++) {
      let e = Object.keys(a)[i];
      if (Object.prototype.hasOwnProperty.call(a, e) && pattern.test(e)) {
        res.push(e);
      }
    }
  }

  return new ListObj(res);
};

subcmds.set = (args, I) => {
  I.checkArgs(args, 2, 'arrayName list');
  let vinfo = I.resolve_var(args[1]);
  let l;
  let k;
  let v;
  let i;

  if (vinfo === undefined) {
    vinfo = I.create_var(args[1], '');
  }

  if (vinfo.type !== ARRAY) {
    throw new TclError(`can't array set "${args[1]}": variable isn't array`, [
      'TCL',
      'WRITE',
      'ARRAY',
    ]);
  }

  l = args[2].GetList();
  for (i = 0; i < l.length; i += 2) {
    k = l[i];
    v = l[i + 1];
    if (Object.prototype.hasOwnProperty.call(vinfo.value, k)) {
      vinfo.value[k].DecrRefCount();
    }
    vinfo.value[k] = tclobj.AsObj(v);
    vinfo.value[k].IncrRefCount();
  }
  return I.EmptyResult;
};

subcmds.size = (args, I) => {
  I.checkArgs(args, 1, 'arrayName');
  let vinfo = I.resolve_var(args[1]);
  let c = 0;

  if (vinfo === undefined || vinfo.type !== ARRAY) {
    return I.EmptyResult;
  }

  for (let i = 0; i < Object.keys(vinfo.value).length; i++) {
    let e = Object.keys(vinfo.value)[i];

    if (Object.prototype.hasOwnProperty.call(vinfo.value, e)) {
      c += 1;
    }
  }

  return new IntObj(c);
};

subcmds.unset = (args, I) => {
  I.checkArgs(args, [1, 2], 'arrayName ?pattern?');
  let vinfo = I.resolve_var(args[1]);
  let a;
  let pattern;

  if (vinfo === undefined || vinfo.type !== ARRAY) {
    return I.EmptyResult;
  }
  a = vinfo.value;
  if (args[2] === undefined) {
    for (let i = 0; i < Object.keys(a).length; i++) {
      let e = Object.keys(a)[i];
      if (Object.prototype.hasOwnProperty.call(a, e)) {
        a[e].DecrRefCount();
        delete a[e];
      }
    }
  } else {
    pattern = utils.glob2regex(args[2]);
    for (let i = 0; i < Object.keys(a).length; i++) {
      let e = Object.keys(a)[i];
      if (Object.prototype.hasOwnProperty.call(a, e) && pattern.test(e)) {
        a[e].DecrRefCount();
        delete a[e];
      }
    }
  }

  return I.EmptyResult;
};

function install(interp) {
  if (interp.register_extension('ex_array_cmds')) {
    return;
  }

  interp.registerCommand('array', (args) => {
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
    return subcmds[subcmd](fakeargs, interp);
  });
}

module.exports = {
  install,
};
