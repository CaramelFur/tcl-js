const utils = require('./utils');
const StringObj = require('./objtype_string');
const IntObj = require('./objtype_int');
const BoolObj = require('./objtype_bool');
const tcllist = require('./list');
const types = require('./types');

let { TclError } = types;
let classTests;

function getStrIdx(str, obj) {
  return utils.resolve_idx(str.length, obj);
}

function changecase(method) {
  return function (args, I) {
    I.checkArgs(args, [1, 3], 'string ?first? ?last?');
    let str = args[1].toString();
    let parts;
    let first = args[2] === undefined ? 0 : getStrIdx(str, args[2]);
    let last = args[3] === undefined ? str.length - 1 : getStrIdx(str, args[3]);
    if (first === 0 && last === str.length - 1) {
      return new StringObj(str[method]());
    }
    parts = [];
    if (first > 0) {
      parts.push(str.substr(0, first));
    }
    parts.push(str.substr(first, last - first + 1)[method]());
    if (last < str.length - 1) {
      parts.push(str.substr(last + 1));
    }
    return new StringObj(parts.join(''));
  };
}

function compareStrings(fn) {
  return function (args, I) {
    I.checkArgs(args, [2, 5], '?-nocase? ?-length int? string1 string2');
    let ignorecase = false;
    let str2 = args.pop().toString();
    let str1 = args.pop().toString();
    let maxchars;
    args.shift();
    while (args.length > 0) {
      switch (args[0].toString()) {
        case '-nocase':
          ignorecase = true;
          args.shift();
          break;
        case '-length':
          args.shift();
          if (args.length === 0) {
            throw new TclError(
              'wrong # args: should be "string compare ?-nocase? ?-length int? string1 string2',
              ['TCL', 'WRONGARGS'],
            );
          }
          maxchars = args.shift().GetInt();
          break;
        default:
          throw new TclError(
            `bad option "${args[0].toString()}": must be -nocase or -length`,
            ['TCL', 'LOOKUP', 'INDEX', 'option', args[0].toString()],
          );
      }
    }

    if (maxchars !== undefined) {
      str1 = str1.substr(0, maxchars);
      str2 = str2.substr(0, maxchars);
    }
    if (ignorecase) {
      str1 = str1.toLowerCase();
      str2 = str2.toLowerCase();
    }
    return fn(str1, str2);
  };
}

function intRangeCheck(bits) {
  return function (s) {
    let m;
    let value;
    m = /^[\+\-]?\d+e[\-+]?\d+?/i.exec(s) ||
      /^[\+\-]?0x[\dA-F]+/i.exec(s) ||
      /^[\+\-]?0b[01]+/i.exec(s) ||
      /^[\+\-]?0o[0-7]+/i.exec(s);
    if (m) {
      value = utils.to_int(s);
      if (Math.abs(value) >= 2 ** bits) {
        return null;
      }
      return m[0].length === s.length ? -1 : m[0].length;
    }
    return 0;
  };
}

// TODO: fix the tests below for unicode (javascript regexe ranges mostly don't
// match unicode, ie. \w is [0-9a-zA-Z_]
classTests = {
  alnum(s) {
    return (
      /[^a-z0-9]/i.exec(s) || {
        index: -1,
      }
    ).index;
  },
  alpha(s) {
    return (
      /[^a-z]/i.exec(s) || {
        index: -1,
      }
    ).index;
  },
  ascii(s) {
    return (
      /[^\x00-\x7f]/.exec(s) || {
        index: -1,
      }
    ).index;
  },
  boolean(s) {
    let m = /^(1|t(?:r(?:ue?)?)?|y(?:es?)?|on|0|f(?:a(?:l(?:se?)?)?)?|no?|off?)/i.exec(
      s,
    );
    if (!m) {
      return 0;
    }
    if (m[0].length === s.length) {
      return -1;
    }
    return 0;
  },
  false(s) {
    let m = /^(0|f(?:a(?:l(?:se?)?)?)?|no?|off?)/i.exec(s);
    if (!m) {
      return 0;
    }
    if (m[0].length === s.length) {
      return -1;
    }
    return 0;
  },
  true(s) {
    let m = /^(1|t(?:r(?:ue?)?)?|y(?:es?)?|on)/i.exec(s);
    if (!m) {
      return 0;
    }
    if (m[0].length === s.length) {
      return -1;
    }
    return 0;
  },
  control(s) {
    return (
      /[^\x00-\x1F]/.exec(s) || {
        index: -1,
      }
    ).index;
  },
  digit(s) {
    return (
      /[^\d]/.exec(s) || {
        index: -1,
      }
    ).index;
  },
  double(s) {
    let m;
    let value;

    m = /^(?:([\-+]?)(Inf(?:inity)?)|(NaN))\b/i.exec(s);
    if (m) {
      if (/n/i.test(m[0][1])) {
        value = NaN;
      } else {
        value = Number(`${m[1]}Infinity`);
      }
      if (m[0].length !== s.length) {
        return m[0].length;
      }
      return -1;
    }
    m = /^[\-+]?\d+(?:(\.)(?:\d+)?)?(e[\-+]?\d+)?/i.exec(s) ||
      /^[\-+]?(\.)\d+(e[\-+]?\d+)?/i.exec(s);
    if (m) {
      value = Number(m[0]);
    } else {
      m = /^[\+\-]?\d+e[\-+]?\d+?/i.exec(s) ||
        /^[\+\-]?0x[\dA-F]+/i.exec(s) ||
        /^[\+\-]?0b[01]+/i.exec(s) ||
        /^[\+\-]?0o[0-7]+/i.exec(s);
      if (m) {
        if (m[0].length !== s.length) {
          return m[0].length;
        }
        value = utils.to_int(s);
      } else {
        return 0;
      }
    }
    if (value === -Infinity || value === Infinity) {
      // WARNING: this assumes javascript's range is the same as Tcl
      // tests indicate that it is, but as far as I know it isn't
      // written into the standard
      return null;
    }
    return -1;
  },
  graph(s) {
    return (
      /[\x00-\x20\x7F-\x9F\xAD]/.exec(s) || {
        index: -1,
      }
    ).index;
  },
  integer: intRangeCheck(32),
  wideinteger: intRangeCheck(64),
  list(s) {
    return tcllist.complete(s) ? -1 : 0;
  },
  lower(s) {
    return (
      /[^a-z]/.exec(s) || {
        index: -1,
      }
    ).index;
  },
  upper(s) {
    return (
      /[^A-Z]/.exec(s) || {
        index: -1,
      }
    ).index;
  },
  print(s) {
    return (
      /[\x00-\x1F\x7F-\x9F\xAD]/.exec(s) || {
        index: -1,
      }
    ).index;
  },
  punct(s) {
    return (
      /[^!"#%&'\(\)\*,\-.\/:;\?@\[\\\]_{}\xa1\xa7\xab\xb6\xb7\xbb\xbf]/.exec(
        s,
      ) || {
        index: -1,
      }
    ).index;
  },
  space(s) {
    return (
      /[^\s]/.exec(s) || {
        index: -1,
      }
    ).index;
  },
  wordchar(s) {
    return (
      /[^\w]/.exec(s) || {
        index: -1,
      }
    ).index;
  },
  xdigit(s) {
    return (
      /[^0-9A-F]/i.exec(s) || {
        index: -1,
      }
    ).index;
  },
};

let subcmds = {};
subcmds.map = (args, I) => {
  let ignorecase = false;
  let mapping;
  let str;
  let cache;
  let i;
  let k;
  let v;
  let patterns;
  I.checkArgs(args, [2, 3], '?-nocase? mapping string');
  if (args.length === 4) {
    if (args[1].toString() !== '-nocase') {
      I.checkArgs(args, 2, '?-nocase? mapping string');
    }
    ignorecase = true;
    args.shift();
  }
  str = args[2].toString();
  if (args[1].cache.string_map === undefined) {
    cache = {
      map: {},
      re: {},
    };
    args[1].cache.string_map = cache;

    mapping = args[1].GetList();
    patterns = [];
    i = 0;
    while (i < mapping.length) {
      if (ignorecase) {
        k = mapping[i].toString().toLowerCase();
        i += 1;
      } else {
        k = mapping[i].toString();
        i += 1;
      }
      v = mapping[i].toString();
      i += 1;
      patterns.push(utils.escape_regex(k));
      cache.map[k] = v;
    }
    cache.base_regex = patterns.join('|');
  } else {
    cache = args[1].cache.string_map;
  }
  if (cache.re === undefined || cache.re.ignoreCase !== ignorecase) {
    cache.re = new RegExp(cache.base_regex, `g${ignorecase ? 'i' : ''}`);
  }
  if (ignorecase) {
    return new StringObj(
      str.replace(cache.re, match => cache.map[match.toLowerCase()]),
    );
  }
  return new StringObj(str.replace(cache.re, match => cache.map[match]));
};
subcmds.trim = (args, I) => {
  let re;
  let chars;
  I.checkArgs(args, [1, 2], 'string ?chars?');
  if (args[2] === undefined) {
    re = /^[ \t\n\r]*((?:.|\n)*?)[ \t\n\r]*$/;
  } else if (args[2].cache.trim_re === undefined) {
    chars = `[${utils.escape_regex(args[2].toString())}]*`;
    re = new RegExp(`^${chars}((?:.|\n)*?)${chars}$`);
    args[2].cache.trim_re = re;
  } else {
    re = args[2].cache.trim_re;
  }
  return re.exec(args[1].toString())[1];
};
subcmds.trimleft = (args, I) => {
  let re;
  let chars;
  I.checkArgs(args, [1, 2], 'string ?chars?');
  if (args[2] === undefined) {
    re = /^[ \t\n\r]*((?:.|\n)*)$/;
  } else if (args[2].cache.trim_re === undefined) {
    chars = `[${utils.escape_regex(args[2].toString())}]*`;
    re = new RegExp(`^${chars}((?:.|\n)*)$`);
    args[2].cache.trim_re = re;
  } else {
    re = args[2].cache.trim_re;
  }
  return re.exec(args[1].toString())[1];
};
subcmds.trimright = (args, I) => {
  let re;
  let chars;
  I.checkArgs(args, [1, 2], 'string ?chars?');
  if (args[2] === undefined) {
    re = /^((?:.|\n)*?)[ \t\n\r]*$/;
  } else if (args[2].cache.trim_re === undefined) {
    chars = `[${utils.escape_regex(args[2].toString())}]*`;
    re = new RegExp(`^((?:.|\n)*?)${chars}$`);
    args[2].cache.trim_re = re;
  } else {
    re = args[2].cache.trim_re;
  }
  return re.exec(args[1].toString())[1];
};
subcmds.tolower = changecase('toLowerCase');
subcmds.toupper = changecase('toUpperCase');
subcmds.totitle = (args, I) => {
  I.checkArgs(args, [1, 3], 'string ?first? ?last?');
  let str = args[1].toString();
  let parts;
  let first = args[2] === undefined ? 0 : getStrIdx(str, args[2]);
  let last = args[3] === undefined ? str.length - 1 : getStrIdx(str, args[3]);
  parts = [];
  if (first > 0) {
    parts.push(str.substr(0, first));
  }
  parts.push(str[first].toUpperCase());
  parts.push(str.substr(first + 1, last - first).toLowerCase());
  if (last < str.length - 1) {
    parts.push(str.substr(last + 1));
  }
  return new StringObj(parts.join(''));
};
subcmds.length = (args, I) => {
  I.checkArgs(args, 1, 'string');
  return new IntObj(args[1].toString().length);
};
subcmds.bytelength = (args, I) => {
  I.checkArgs(args, 1, 'string');
  return new IntObj(
    require('webtoolkit/utf8').encode(args[1].toString()).length,
  );
};
subcmds.first = (args, I) => {
  I.checkArgs(args, [2, 3], 'needleString haystackString ?startIndex?');
  let needle = args[1].toString();
  let haystack = args[2].toString();
  let idx = args[3] === undefined ? 0 : getStrIdx(haystack, args[3]);
  return new IntObj(haystack.indexOf(needle, idx));
};
subcmds.last = (args, I) => {
  I.checkArgs(args, [2, 3], 'needleString haystackString ?startIndex?');
  let needle = args[1].toString();
  let haystack = args[2].toString();
  let idx = args[3] === undefined ? haystack.length : getStrIdx(haystack, args[3]);
  return new IntObj(haystack.lastIndexOf(needle, idx));
};
subcmds.index = (args, I) => {
  I.checkArgs(args, 2, 'string index');
  let str = args[1].toString();
  let index = getStrIdx(str, args[2]);
  return new StringObj(str.charAt(index) || '');
};
subcmds.range = (args, I) => {
  I.checkArgs(args, 3, 'string first last');
  let str = args[1].toString();
  let first = Math.max(0, getStrIdx(str, args[2]));
  let last = getStrIdx(str, args[3]);
  let res = str.substr(first, last - first + 1);
  return new StringObj(res === undefined ? '' : res);
};
subcmds.reverse = (args, I) => {
  I.checkArgs(args, 1, 'string');
  return new StringObj(
    args[1]
      .toString()
      .split('')
      .reverse()
      .join(''),
  );
};
subcmds.repeat = (args, I) => {
  I.checkArgs(args, 2, 'string count');
  let str = args[1].toString();
  let i = args[2].GetInt();
  let res = '';
  if (i < 1) {
    return types.EmptyString;
  }
  while (i > 0) {
    if (i & 1) {
      res += str;
    }
    i >>= 1;
    str += str;
  }
  return new StringObj(res);
};
subcmds.replace = (args, I) => {
  I.checkArgs(args, [3, 4], 'string first last ?newstring?');
  let str = args[1].toString();
  let first = Math.max(0, getStrIdx(str, args[2]));
  let last = Math.min(str.length, getStrIdx(str, args[3]));
  let parts = [];
  if (first > last) {
    return types.EmptyString;
  }
  if (first > 0) {
    parts.push(str.substr(0, first));
  }
  if (args[4] !== undefined) {
    parts.push(args[4].toString());
  }
  if (last < str.length - 1) {
    parts.push(str.substr(last + 1));
  }
  return new StringObj(parts.join(''));
};
subcmds.match = (args, I) => {
  I.checkArgs(args, [2, 3], '?-nocase? pattern string');
  let str;
  let pattern;
  let ignorecase = false;
  if (args.length === 4) {
    if (args[1].toString() !== '-nocase') {
      I.checkArgs(args, 2, '?-nocase? pattern string');
    }
    args.shift();
    ignorecase = true;
  }
  pattern = utils.glob2regex(args[1].toString(), ignorecase);
  str = args[2].toString();
  return new BoolObj(pattern.test(str));
};
subcmds.wordstart = (args, I) => {
  I.checkArgs(args, 2, 'string charIndex');
  let m;
  let str = args[1].toString();
  let idx = getStrIdx(str, args[2]);
  if (idx < 0) {
    return new IntObj(0);
  }
  // TODO: make unicode aware (\w is [0-9a-zA-Z_]), maybe XRegExp?
  m = /\w+$/.exec(str.substr(0, idx + 1));
  if (m) {
    return new IntObj(m.index);
  }
  return new IntObj(idx);
};
subcmds.wordend = (args, I) => {
  I.checkArgs(args, 2, 'string charIndex');
  let m;
  let str = args[1].toString();
  let idx = getStrIdx(str, args[2]);
  if (idx >= str.length) {
    return new IntObj(str.length);
  }
  // TODO: make unicode aware (\w is [0-9a-zA-Z_]), maybe XRegExp?
  m = /^\w+/.exec(str.substr(idx));
  if (m) {
    return new IntObj(idx + m[0].length);
  }
  return new IntObj(idx + 1);
};
subcmds.compare = compareStrings((str1, str2) => {
  let res = str1.localeCompare(str2);
  if (res < -1) {
    res = -1;
  }
  if (res > 1) {
    res = 1;
  }
  return new IntObj(res);
});
subcmds.equal = compareStrings((str1, str2) => new BoolObj(str1 === str2));
subcmds.is = (args, I) => {
  I.checkArgs(args, [2, 5], 'class ?-strict? ?-failindex varname? string');
  args.shift();
  let charclass = args.shift().toString();
  let str = args.pop().toString();
  let strict = false;
  let failindexvar;
  let failindex;
  let arg;
  while (args.length > 0) {
    arg = args.shift().toString();
    switch (arg) {
      case '-strict':
        strict = true;
        break;
      case '-failindex':
        if (args.length < 1) {
          throw new TclError(
            'wrong # args: should be "string is class ?-strict? ?-failindex varname? string',
            ['TCL', 'WRONGARGS'],
          );
        }
        failindexvar = args.shift();
        break;
      default:
    }
  }
  if (classTests[charclass] === undefined) {
    throw new TclError(
      `bad class "${charclass}": must be ${utils
        .objkeys(classTests)
        .join(', ')}`,
      ['TCL', 'LOOKUP', 'INDEX', 'class', charclass],
    );
  }
  if (str.length === 0) {
    return new BoolObj(!strict);
  }

  failindex = classTests[charclass](str);
  if (failindex === null || failindex >= 0) {
    if (failindex === null) {
      failindex = -1;
    }
    if (failindexvar !== undefined) {
      I.set_var(failindexvar, new IntObj(failindex));
    }
    return new BoolObj(false);
  }
  return new BoolObj(true);
};

function install(interp) {
  if (interp.register_extension('ex_string_cmds')) {
    return;
  }

  interp.registerCommand('string', (args) => {
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
