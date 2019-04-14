const types = require('./types');
const tclobj = require('./tclobject');

let { TclError } = types;

let utils = {
  glob2regex(glob, ignorecase) {
    let re = String(glob).replace(/([.+\^$\\(){}|\-])/g, '\\$1');
    re = re.replace(/\*/g, '.*');
    re = re.replace(/\?/g, '.');
    return new RegExp(`^${re}$`, ignorecase ? 'i' : '');
  },

  escape_regex(str) {
    return String(str).replace(/([\[\]\.\*\?\+\^$\\(){}|\-])/g, '\\$1');
  },

  objkeys: Object.prototype.keys
    ? function(o) {
        return o.keys();
      }
    : function(o) {
        let e;
        let res = [];
        for (e in o) {
          if (o.hasOwnProperty(e)) {
            res.push(e);
          }
        }
        return res;
      },

  to_number(value) {
    if (typeof value === 'number') {
      return value;
    }
    let str = String(value);
    let m;
    if ((m = /^(?:([\-+]?)(Inf(?:inity)?)|(NaN))\b/i.exec(str))) {
      if (/n/i.test(m[0][1])) {
        return NaN;
      }
      return Number(`${m[1]}Infinity`);
    }
    if (
      (m =
        /^[\-+]?\d+(?:(\.)(?:\d+)?)?(e[\-+]?\d+)?/i.exec(str) ||
        /^[\-+]?(\.)\d+(e[\-+]?\d+)?/i.exec(str))
    ) {
      return Number(m[0]);
    }
    if (
      (m =
        /^([\-+])?(0x)([\dA-F]+)/i.exec(str) ||
        /^([\-+])?(0b)([01]+)/i.exec(str) ||
        /^([\-+])?(0o)([0-7]+)/i.exec(str))
    ) {
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
  },

  to_int(value) {
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
    if (
      (m =
        /^([\+\-])?(0)(\d+)$/i.exec(str) ||
        /^([\+\-])?()(\d+)(?:e([\-+]?\d+))?$/i.exec(str) ||
        /^([\+\-])?(0x)([\dA-F]+)$/i.exec(str) ||
        /^([\+\-])?(0b)([01]+)$/i.exec(str) ||
        /^([\+\-])?(0o)([0-7]+)$/i.exec(str))
    ) {
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
        ) * Math.pow(10, m[4])
      );
    }

    throw new types.TclError(`expected integer but got "${str}"`, [
      'TCL',
      'VALUE',
      'NUMBER',
    ]);
  },

  resolve_idx(len, obj) {
    let idx;
    let a;
    let op;
    let b;
    let matches;
    obj = tclobj.AsObj(obj);

    function err() {
      throw new TclError(
        `bad index "${obj}": must be integer?[+-]integer? or end?[+-]integer?`,
        ['TCL', 'VALUE', 'INDEX'],
      );
    }

    try {
      return obj.GetInt();
    } catch (ignore) {}

    idx = obj.GetString();
    if (idx === 'end') {
      return len - 1;
    }
    if ((matches = /^(.*?)([+\-])(.*)$/.exec(idx))) {
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
  },

  bool(str) {
    let m;
    let num;

    function err() {
      throw new Error(`invalid boolean value "${str}"`);
    }
    switch (typeof str) {
      case 'boolean':
        return str;
      case 'number':
        return !isNaN(str) && str !== 0;
      case 'object':
        if (str instanceof types.TclObject) {
          return str.GetBool();
        }
        str = str.toString();
      case 'string':
        if ((m = /^(t(?:r(?:ue?)?)?|y(?:es?)?|on)/i.exec(str))) {
          if (m[0].length !== str.length) {
            err();
          }
          return true;
        }
        if ((m = /^(0|f(?:a(?:l(?:se?)?)?)?|no?|off?)/i.exec(str))) {
          if (m[0].length !== str.length) {
            err();
          }
          return false;
        }

        num = utils.to_number(str);
        if (isNaN(num)) {
          err();
        }
        return num !== 0;
      default:
        err();
    }
  },

  not_implemented() {
    throw new types.TclError('Not implemented yet', ['TCL', 'NOT_IMPLEMENTED']);
  },
};
module.exports = utils;
