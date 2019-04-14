const tclobj = require('./tclobject');
const ListObj = require('./objtype_list');
const utils = require('./utils');

function resolve_index(list, obj) {
  return utils.resolve_idx(list.length, obj);
}

function install(interp) {
  let { TclError } = interp;
  if (interp.register_extension('ex_list_cmds')) {
    return;
  }

  /* list commands still to implement:
	 lsearch linsert lreplace lset lsort
	 */

  interp.registerCommand('lassign', (args) => {
    interp.checkArgs(args, [1, null], 'list ?varname ...?');
    let list = args[1].GetList();
    let i;
    let idx;
    for (i = 2, idx = 0; i < args.length; i++, idx++) {
      interp.set_scalar(args[i], list[idx] || '');
    }
    return new ListObj(list.slice(idx));
  });

  interp.registerCommand('lrange', (args) => {
    interp.checkArgs(args, 3, 'list first last');
    let list = args[1].GetList();
    let a = resolve_index(list, args[2]);
    let b = resolve_index(list, args[3]);
    return new ListObj(list.slice(a, b - a + 1));
  });

  interp.registerCommand('llength', (args) => {
    interp.checkArgs(args, 1, 'list');
    let list = args[1].GetList();
    return tclobj.NewInt(list.length);
  });

  interp.registerCommand('split', (args) => {
    interp.checkArgs(args, [1, 2], 'string ?splitChars?');
    let re = args[2] === undefined ?
      /\s/ :
      new RegExp(`[${utils.escape_regex(args[2])}]`);
    return new ListObj(args[1].toString().split(re));
  });

  interp.registerCommand('join', (args) => {
    interp.checkArgs(args, [1, 2], 'list ?joinString?');
    let list = args[1].GetList();
    let joinString = args[2] === undefined ? ' ' : args[2].toString();
    return new ListObj(list.join(joinString));
  });

  interp.registerCommand('concat', (args) => {
    let i;
    let lists = [];
    for (i = 1; i < args.length; i++) {
      lists.push(args[i].GetList());
    }
    // TODO: this is not quite right - concat trims whitespace from its
    // args before joining them with ' '
    return new ListObj(Array.prototype.concat.apply([], lists));
  });

  interp.registerCommand('lappend', (args) => {
    interp.checkArgs(args, [1, null], 'varname ?value ...?');
    if (args.length === 2) {
      return interp.get_scalar(args[1]);
    }
    let listobj = interp.get_scalar(args[1], true);
    let list;
    let i;
    list = listobj.GetList();
    listobj.InvalidateCaches();
    for (i = 2; i < args.length; i++) {
      list.push(args[i]);
    }
    return listobj;
  });

  interp.registerCommand('lreverse', (args) => {
    interp.checkArgs(args, 1, 'list');
    return new ListObj(args[1].GetList().reverse());
  });

  interp.registerCommand('list', args => new ListObj(args.slice(1)));

  interp.registerCommand('lindex', (args) => {
    let i; let obj; let idx; let
      list;
    interp.checkArgs(args, [1, null], 'list ?index ...?');

    obj = args[1];

    for (i = 2; i < args.length; i++) {
      list = obj.GetList();
      idx = resolve_index(list, args[i]);
      obj = list[idx];
    }
    return obj;
  });

  interp.registerCommand('lrepeat', (args) => {
    interp.checkArgs(args, [1, null], 'count ?element ...?');
    let count = args[1].GetInt();
    let elements = args.slice(2);
    let out = [];
    let i;
    let total = count * elements.length;
    for (i = 0; i < total; i++) {
      out.push(elements[i % elements.length]);
    }
    return new ListObj(out);
  });
}

module.exports = {
  install,
};
