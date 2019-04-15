const types = require('./types');
const tclobj = require('./tclobject');

let { TclError } = types;

let utils = {};
utils.glob2regex = (glob, ignorecase) => {
  let re = String(glob).replace(/([.+\^$\\(){}|\-])/g, '\\$1');
  re = re.replace(/\*/g, '.*');
  re = re.replace(/\?/g, '.');
  return new RegExp(`^${re}$`, ignorecase ? 'i' : '');
};

utils.escape_regex = str => String(str).replace(/([\[\]\.\*\?\+\^$\\(){}|\-])/g, '\\$1');

utils.objkeys = o => Object.keys(o);

utils.to_number = (value) => {
  if (typeof value === 'number') {
    return value;
  }
  let str = String(value);
  let m;
  m = /^(?:([\-+]?)(Inf(?:inity)?)|(NaN))\b/i.exec(str);
  if (m) {
    if (/n/i.test(m[0][1])) {
      return NaN;
    }
    return Number(`${m[1]}Infinity`);
  }
  m = /^[\-+]?\d+(?:(\.)(?:\d+)?)?(e[\-+]?\d+)?/i.exec(str) ||
    /^[\-+]?(\.)\d+(e[\-+]?\d+)?/i.exec(str);
  if (m) {
    return Number(m[0]);
  }
  m = /^([\-+])?(0x)([\dA-F]+)/i.exec(str) ||
    /^([\-+])?(0b)([01]+)/i.exec(str) ||
    /^([\-+])?(0o)([0-7]+)/i.exec(str);
  if (m) {
    // TODO: Bignum support
    return parseInt(
      (m[1] || '') + m[3],
      {
        '': 10,
        '0x': 16,
        '0b': 2,
        '0o': 8,
      }[m[2]],
    );
  }
  return NaN;
};

utils.to_int = (value) => {
  let m;
  let str;
  if (typeof value === 'number') {
    if (value % 1 !== 0) {
      throw new types.TclError(`expected integer but got "${str}"`, [
        'TCL',
        'VALUE',
        'NUMBER',
      ]);
    }
    return value;
  }
  str = String(value);
  m = /^([\+\-])?(0)(\d+)$/i.exec(str) ||
    /^([\+\-])?()(\d+)(?:e([\-+]?\d+))?$/i.exec(str) ||
    /^([\+\-])?(0x)([\dA-F]+)$/i.exec(str) ||
    /^([\+\-])?(0b)([01]+)$/i.exec(str) ||
    /^([\+\-])?(0o)([0-7]+)$/i.exec(str);

  if (m) {
    // TODO: Bignum support
    if (m[4] === undefined) {
      return parseInt(
        (m[1] || '') + m[3],
        {
          '': 10,
          '0x': 16,
          '0b': 2,
          0: 8,
          '0o': 8,
        }[m[2]],
      );
    }
    let powered = 10 ** m[4];
    return (
      parseInt(
        (m[1] || '') + m[3],
        {
          '': 10,
          '0x': 16,
          '0b': 2,
          0: 8,
          '0o': 8,
        }[m[2]],
      ) * powered
    );
  }

  throw new types.TclError(`expected integer but got "${str}"`, [
    'TCL',
    'VALUE',
    'NUMBER',
  ]);
};

utils.resolve_idx = (len, objArg) => {
  let idx;
  let a;
  let op;
  let b;
  let matches;
  let obj = tclobj.AsObj(objArg);

  function err() {
    throw new TclError(
      `bad index "${obj}": must be integer?[+-]integer? or end?[+-]integer?`,
      ['TCL', 'VALUE', 'INDEX'],
    );
  }

  try {
    return obj.GetInt();
  } catch (ignore) {
    // Ignore
  }

  idx = obj.GetString();
  if (idx === 'end') {
    return len - 1;
  }
  matches = /^(.*?)([+\-])(.*)$/.exec(idx);
  if (matches) {
    a = matches[1] === 'end' ? len - 1 : utils.to_int(matches[1]);
    op = matches[2];
    b = utils.to_int(matches[3]);
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      default:
        err();
    }
  }
  err();
};

utils.bool = (strArg) => {
  let str = strArg;
  let m;
  let num;

  function err() {
    throw new Error(`invalid boolean value "${str}"`);
  }

  if (typeof str === 'object') {
    if (str instanceof types.TclObject) {
      return str.GetBool();
    }
    str = str.toString();
  }

  switch (typeof str) {
    case 'boolean':
      return str;
    case 'number':
      return str && str !== 0;
    case 'object':
      // Should not be hit
      break;
    case 'string':
      m = /^(t(?:r(?:ue?)?)?|y(?:es?)?|on)/i.exec(str);
      if (m) {
        if (m[0].length !== str.length) {
          err();
        }
        return true;
      }
      m = /^(0|f(?:a(?:l(?:se?)?)?)?|no?|off?)/i.exec(str);
      if (m) {
        if (m[0].length !== str.length) {
          err();
        }
        return false;
      }

      num = utils.to_number(str);
      if (typeof num !== 'number') {
        err();
      }
      return num !== 0;
    default:
      err();
  }
};

utils.not_implemented = () => {
  throw new types.TclError('Not implemented yet', ['TCL', 'NOT_IMPLEMENTED']);
};

module.exports = utils;
