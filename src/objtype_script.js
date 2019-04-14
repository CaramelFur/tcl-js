const types = require('./types');
const tclobj = require('./tclobject');
const parser = require('./parser');

function commands2string(commands) {
  let i;
  let j;
  let out = '';

  function tokens2string(tokens) {
    let i;
    let token;
    let out = '';
    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];
      if (token[0] === parser.SCRIPT) {
        out += commands2string(token[1]);
      } else if (token[0] === parser.INDEX) {
        continue;
      } else {
        out += token[1];
      }
    }
    return out;
  }

  for (i = 0; i < commands.length; i++) {
    for (j = 0; j < commands[i].length; j++) {
      out += tokens2string(commands[i][j]);
    }
  }
  return out;
}

function jsval_from_string(str) {
  return {
    commands: parser.parse_script(str),
  };
}

let script_handlers = {
  type: 'script',
  dupJsVal(obj) {
    let newjsval = jsval_from_string(obj.toString());
    return newjsval;
  },
  updateString(obj) {
    obj.bytes = commands2string(obj.jsval.commands[1]);
  },
  setFromAny(obj) {
    let newjsval = jsval_from_string(obj.toString());
    obj.FreeJsVal();
    obj.jsval = newjsval;
  },
};

function ScriptObj(value) {
  let i;
  this.handlers = script_handlers;
  this._init();
  if (value instanceof Array && value[0] === parser.SCRIPT) {
    this.jsval = {
      commands: [],
    };
    for (i = 0; i < value.length; i++) {
      if (value[i] instanceof Array) {
        this.jsval.commands.push(value[i].slice());
      } else {
        this.jsval.commands.push(value[i]);
      }
    }
  } else {
    this.jsval = jsval_from_string(String(value));
  }
}
ScriptObj.prototype = new types.TclObject();

tclobj.RegisterObjType('script', script_handlers);

types.TclObjectBase.GetParsedScript = function () {
  if (this.handlers !== script_handlers) {
    this.ConvertToType('script');
  }
  return this.jsval.commands;
};
types.TclObjectBase.GetExecParse = function (I) {
  if (this.handlers !== script_handlers) {
    this.ConvertToType('script');
  }
  if (this.jsval.exec_commands === undefined) {
    this.jsval.exec_commands = I.compile_script(this.jsval.commands[1]);
  }
  return this.jsval.exec_commands;
};

tclobj.NewScript = function (val) {
  return new ScriptObj(val);
};

module.exports = ScriptObj;
