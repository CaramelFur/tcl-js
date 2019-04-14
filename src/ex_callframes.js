const types = require('./types');
const ListObj = require('./objtype_list');

let { SCALAR } = types;
let { ARRAY } = types;
let { EmptyString } = types;

function install(interp) {
  if (interp.register_extension('ex_callframes')) {
    return;
  }

  let callframes = [{}];
  let frame = callframes[0];
  let { TclError } = interp;

  interp.override('resolve_var', varname => frame[varname]);

  interp.override('create_var', (varname, index) => {
    if (index === undefined) {
      frame[varname] = {
        type: SCALAR,
        value: EmptyString,
      };
      frame[varname].value.IncrRefCount();
    } else {
      frame[varname] = {
        type: ARRAY,
        value: {},
      };
    }
    return frame[varname];
  });

  interp.override('delete_var', (varname) => {
    let arr;
    if (frame[varname] === undefined) {
      return;
    }
    switch (frame[varname].type) {
      case SCALAR:
        frame[varname].value.DecrRefCount();
        break;
      case ARRAY:
        arr = frame[varname].value;

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
    delete frame[varname];
  });

  interp.push_callframe = function () {
    callframes.push({});
    frame = callframes[callframes.length - 1];
  };

  interp.pop_callframe = function () {
    if (callframes.length === 1) {
      return;
    }
    let expiringVars = callframes.pop();

    let v;

    for (let i = 0; i < Object.keys(expiringVars).length; i++) {
      let e = Object.keys(expiringVars)[i];
      if (Object.prototype.hasOwnProperty.call(expiringVars, e)) {
        v = expiringVars[e];
        switch (v.type) {
          case SCALAR:
            v.value.DecrRefCount();
            // delete v.value;
            break;
          case ARRAY:
            for (let j = 0; j < Object.keys(v).length; j++) {
              let index = Object.keys(v)[j];
              if (Object.prototype.hasOwnProperty.call(v, index)) {
                v[index].value.DecrRefCount();
                // delete v[index];
              }
            }
            break;
          default:
          // Alias?
        }
      }
    }

    frame = callframes[callframes.length - 1];
  };

  function compileArgs(argsList, initialArgs) {
    let argsDesc = initialArgs;
    let argAssigners = [];
    let argInfo;
    let i;

    function assignRequiredArg(name) {
      return function (a, inp) {
        let p = inp;
        if (p >= a.length) {
          throw new TclError(
            `wrong # args: should be "${argsDesc.join(' ')}"`,
            ['TCL', 'WRONGARGS'],
          );
        }
        interp.set_scalar(name, a[p]);
        p += 1;
        return p;
      };
    }

    function assignOptionalArg(name, defaultval) {
      return function (a, inp) {
        let p = inp;
        interp.set_scalar(name, p < a.length ? a[p] : defaultval);
        if (p < a.length) p += 1;
        return p;
      };
    }

    function assignArgs() {
      return function (a, p) {
        interp.set_scalar('args', new ListObj(a.slice(p)));
        return a.length;
      };
    }

    for (i = 0; i < argsList.length; i++) {
      argInfo = argsList[i].GetList();
      if (
        i === argsList.length - 1 &&
        argInfo.length &&
        argInfo[0].toString() === 'args'
      ) {
        argsDesc.push('?arg ...?');
        argAssigners.push(assignArgs());
        break;
      }
      switch (argInfo.length) {
        case 0:
          throw new TclError('argument with no name', [
            'TCL',
            'OPERATION',
            'PROC',
            'FORMALARGUMENTFORMAT',
          ]);
        case 1:
          argsDesc.push(argInfo[0]);
          argAssigners.push(assignRequiredArg(argInfo[0]));
          break;
        case 2:
          argsDesc.push(`?${argInfo[0]}?`);
          argAssigners.push(assignOptionalArg(argInfo[0], argInfo[1]));
          break;
        default:
          throw new TclError(
            `too many fields in argument specifier "${argsList[i].toString()}"`,
            ['TCL', 'OPERATION', 'PROC', 'FORMALARGUMENTFORMAT'],
          );
      }
    }

    return {
      args_desc: argsDesc.join(' '),
      arg_assigners: argAssigners,
    };
  }

  interp.registerCommand('proc', (args) => {
    interp.checkArgs(args, 3, 'name args body');

    let argInfo = compileArgs(args[2].GetList(), [args[1].toString()]);

    interp.registerAsyncCommand(args[1], (c, pargs) => {
      let i = 0;
      let p = 1;
      interp.push_callframe();
      try {
        while (i < argInfo.arg_assigners.length) {
          p = argInfo.arg_assigners[i](pargs, p);
          i += 1;
        }
        if (p < pargs.length) {
          throw new TclError(`wrong # args: should be "${argInfo.args_desc}"`, [
            'TCL',
            'WRONGARGS',
          ]);
        }
        return interp.exec(args[3], (res) => {
          // TODO: for errors, assemble errorInfo and friends
          interp.pop_callframe();
          if (res.code === types.RETURN) {
            res.level -= 1;
            if (res.level <= 0) {
              res.code = res.finalcode.GetInt();
              res.level = 0;
            }
          }
          return c(res);
        });
      } catch (e) {
        interp.pop_callframe();
        throw e;
      }
    });

    return interp.EmptyResult;
  });

  interp.registerAsyncCommand('apply', (c, args) => {
    interp.checkArgs(args, [1, null], 'lambdaExpr ?arg ...?');
    let l;
    let i = 0;
    let p = 1;
    let linfo;
    if (args[1].cache.lambda === undefined) {
      linfo = args[1].GetList();
      args[1].cache.lambda = compileArgs(linfo[0].GetList(), [
        'apply',
        'lambdaExpr',
      ]);
      args[1].cache.lambda.body = linfo[1];
      args[1].cache.lambda.ns = linfo[2];
    }
    l = args[1].cache.lambda;
    args.shift();
    interp.push_callframe();
    try {
      while (i < l.arg_assigners.length) {
        p = l.arg_assigners[i](args, p);
        i += 1;
      }
      if (p < args.length) {
        throw new TclError(`wrong # args: should be "${l.args_desc}"`, [
          'TCL',
          'WRONGARGS',
        ]);
      }
      return interp.exec(l.body, (res) => {
        interp.pop_callframe();
        if (res.code === types.RETURN) {
          res.level -= 1;
          if (res.level <= 0) {
            res.code = res.finalcode.GetInt();
            res.level = 0;
          }
        }
        return c(res);
      });
    } catch (e) {
      interp.pop_callframe();
      throw e;
    }
  });
}

module.exports = {
  install,
};
