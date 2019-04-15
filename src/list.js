const types = require('./types');

let hexChars = /[\dabcdefABCDEF]/;
let whitespace = /\s/;
let backquotechars = /[\\ \t\f\n\r\v{}"\[\]$;]/g;
let backquotemap = {
  '\t': 't',
  '\f': 'f',
  '\n': 'n',
  '\r': 'r',
  '\v': 'v',
  '\\': '\\',
  ' ': ' ',
  '{': '{',
  '}': '}',
  '"': '"',
  '[': '[',
  ']': ']',
  $: '$',
  ';': ';',
};

// Exceptions <<<
function ParseError(message) {
  this.name = 'ParseError';
  this.message = message;
}
ParseError.prototype = new Error();

function IncompleteError(message, missing) {
  this.name = 'IncompleteError';
  this.message = message;
  this.missing = missing;
}
IncompleteError.prototype = new ParseError();
// Exceptions >>>

function unicodeChar(value) {
  // <<<
  return String.fromCharCode(value);
}

// >>>
function parseTclList(str) {
  // <<<
  let ofs = -1;
  let parts = [];
  let elem = '';
  let inElem = false;
  let braced = false;
  let quoted = false;
  let bracedepth = 0;
  let braceescape = false;
  let elemstart = false;
  let escaped = false;
  let escapeSeq = '';
  let escapeMode = '';
  let needspace = false;
  let braceofs = 0;
  let quoteofs = 0;
  let c;
  let finished = false;
  let cont = false;
  let acc;
  let pow;
  let i;
  let lsd;

  if (str === undefined || str === null) {
    return [];
  }

  for (i = 0; i < str.length; i++) {
    ofs += 1;

    c = str.charAt(i);

    if (needspace) {
      // continues <<<
      if (whitespace.test(c)) {
        needspace = 0;
        continue;
      }
      throw new ParseError(
        `Garbage after list element at offset ${ofs}: "${c}"`,
      );
    }
    // >>>
    if (!inElem) {
      // fallthrough if c not a space <<<
      if (whitespace.test(c)) {
        continue;
      }
      inElem = true;
      elemstart = true;
    }
    // >>>
    if (elemstart) {
      // continues <<<
      switch (c) {
        case '{':
          braced = true;
          bracedepth = true;
          braceofs = ofs;
          break;
        case '"':
          quoted = true;
          break;
        case '\\':
          escaped = true;
          break;
        default:
          elem += c;
      }
      elemstart = false;
      continue;
    }
    // >>>
    if (escaped) {
      // sometimes falls through <<<
      if (escapeMode === '') {
        // <<<
        switch (c) {
          case 'a':
            elem += '\u0007';
            escaped = false;
            break;
          case 'b':
            elem += '\u0008';
            escaped = false;
            break;
          case 'f':
            elem += '\u000c';
            escaped = false;
            break;
          case 'n':
            elem += '\u000a';
            escaped = false;
            break;
          case 'r':
            elem += '\u000d';
            escaped = false;
            break;
          case 't':
            elem += '\u0009';
            escaped = false;
            break;
          case 'v':
            elem += '\u000b';
            escaped = false;
            break;

          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
            escapeMode = 'octal';
            escapeSeq += c;
            break;

          case 'x':
            escapeMode = 'hex';
            break;

          case 'u':
            escapeMode = 'unicode';
            break;

          default:
            elem += c;
            escaped = false;
            break;
        }
        if (!escaped) {
          escapeMode = '';
        }
        continue;
        // >>>
      } else if (escapeMode === 'octal') {
        // <<<
        finished = false;
        cont = false;
        switch (c) {
          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
            escapeSeq += c;
            if (escapeSeq.length === 3) {
              finished = true;
            } else {
              finished = false;
            }
            cont = true;
            break;

          default:
            finished = true;
            cont = false;
            break;
        }
        if (finished) {
          acc = 0;
          pow = 0;
          while (escapeSeq.length > 0) {
            lsd = escapeSeq.substr(-1, 1);
            escapeSeq = escapeSeq.slice(0, -1);
            acc += lsd * (8 ** pow);
            pow += 1;
          }
          elem += unicodeChar(acc);
          escapeMode = '';
          escaped = false;
        }
        if (cont) {
          continue;
        }
        // >>>
      } else if (escapeMode === 'hex') {
        // <<<
        if (hexChars.test(c)) {
          escapeSeq += c;
          continue;
        } else {
          if (escapeSeq.length === 0) {
            elem += `x${c}`;
            escaped = false;
            escapeMode = '';
            continue;
          }
          if (escapeSeq.length > 2) {
            escapeSeq = escapeSeq.substr(-2, 2);
          }
        }
        elem += unicodeChar(`0x${escapeSeq}`);
        escapeMode = '';
        escaped = false;
        // >>>
      } else if (escapeMode === 'unicode') {
        // <<<
        finished = false;
        cont = false;

        if (hexChars.test(c)) {
          escapeSeq += c;
          if (escapeSeq.length === 4) {
            finished = true;
          } else {
            finished = false;
          }
          cont = true;
        } else {
          finished = true;
          cont = false;
        }

        if (finished) {
          if (escapeSeq.length === 0) {
            elem += 'u';
          } else {
            while (escapeSeq.length < 4) {
              escapeSeq = `0${escapeSeq}`;
            }
            /* jslint evil: true */
            elem += eval(`"\\u${escapeSeq}"`);
            /* jslint evil: false */
            escapeSeq = '';
          }
          escapeMode = '';
          escaped = false;
        }

        if (cont) {
          continue;
        }
        // >>>
      } else {
        throw new Error(
          `Error in escape sequence parser state: invalid state "${escapeMode}"`,
        );
      }
    }
    // >>>
    if (braced) {
      // continues <<<
      if (braceescape) {
        elem += `\\${c}`;
        braceescape = false;
        continue;
      }
      switch (c) {
        case '{':
          elem += c;
          bracedepth += 1;
          break;
        case '}':
          bracedepth -= 1;
          if (bracedepth === 0) {
            braced = false;
            needspace = true;
            inElem = false;
            parts.push(elem);
            elem = '';
          } else {
            elem += c;
          }
          break;
        case '\\':
          braceescape = true;
          break;
        default:
          elem += c;
      }
      continue;
    }
    // >>>
    if (quoted) {
      // continues <<<
      if (c === '"') {
        quoted = false;
        inElem = false;
        parts.push(elem);
        elem = '';
        needspace = false;
      } else if (c === '\\') {
        escaped = true;
      } else {
        elem += c;
      }
      continue;
    }
    // >>>
    if (whitespace.test(c)) {
      // continues <<<
      parts.push(elem);
      elem = '';
      inElem = false;
      continue;
    }
    // >>>
    if (c === '\\') {
      // continues <<<
      escaped = true;
      continue;
    }
    // >>>

    elem += c;
  }

  if (braced) {
    // <<<
    throw new IncompleteError(
      `Open brace in string (from offset ${braceofs})`,
      'brace',
    );
  }
  // >>>
  if (quoted) {
    // <<<
    throw new IncompleteError(
      `Open quote in string (from offset ${quoteofs})`,
      'quote',
    );
  }
  // >>>
  if (escaped) {
    // <<<
    switch (escapeMode) {
      case '':
        elem += '\\';
        parts.push(elem);
        inElem = false;
        break;

      case 'octal':
        acc = 0;
        pow = 0;
        while (escapeSeq.length > 0) {
          lsd = escapeSeq.substr(-1, 1);
          escapeSeq = escapeSeq.slice(0, -1);
          acc += lsd * (8 ** pow);
          pow += 1;
        }
        elem += unicodeChar(acc);
        escapeMode = '';
        escaped = false;
        break;

      case 'hex':
        if (escapeSeq.length === 0) {
          elem += 'x';
        } else {
          if (escapeSeq.length > 2) {
            escapeSeq = escapeSeq.substr(-2, 2);
          }
          elem += unicodeChar(`0x${escapeSeq}`);
        }
        escapeMode = '';
        escaped = false;
        break;

      case 'unicode':
        if (escapeSeq.length === 0) {
          elem += 'u';
        } else {
          while (escapeSeq.length < 4) {
            escapeSeq = `0${escapeSeq}`;
          }
          /* jslint evil: true */
          elem += eval(`"\\u${escapeSeq}"`);
          /* jslint evil: false */
        }
        escapeMode = '';
        escaped = false;
        break;

      default:
        throw new Error(
          `Error in escape sequence parser state: invalid state "${escapeMode}"`,
        );
      // break;
    }
  }
  // >>>
  if (inElem) {
    // <<<
    parts.push(elem);
    elem = '';
  }
  // >>>

  return parts;
}

// >>>
function quoteElem(elemArg) {
  // <<<
  let m;
  let c;
  let depth;

  let elem = String(elemArg);

  function backquote() {
    return elem.replace(backquotechars, match => `\\${backquotemap[match]}`);
  }

  if (elem.length === 0) {
    return '{}';
  }
  if (!/^[{"]/.test(elem) && /[ \t\f\n\r\v\[\]$;]/.test(elem) === false) {
    return elem.replace(/\\/g, '\\\\');
  }
  m = /\\+$/.exec(elem);
  if (m && m[0].length % 2 === 1) {
    // There is an odd number of \ characters at end of elem, can't
    // brace quote
    return backquote();
  }
  if (!/{|}/.test(elem)) {
    return `{${elem}}`;
  }
  depth = 0;
  for (c = 0; c < elem.length; c++) {
    switch (elem.charAt(c)) {
      case '\\':
        c += 1;
        break;
      case '{':
        depth += 1;
        break;
      case '}':
        depth -= 1;
        break;
      default:
    }
    if (depth < 0) {
      return backquote();
    }
  }
  if (depth > 0) {
    return backquote();
  }
  return `{${elem}}`;
}

// >>>
function serializeTclList(arr) {
  // <<<
  let i;
  let staged = new Array(arr.length);
  for (i = 0; i < arr.length; i++) {
    staged[i] = quoteElem(arr[i]);
  }
  return staged.join(' ');
}

// >>>
function array2dict(arr) {
  // <<<
  let build;
  let i;
  build = {};

  for (i = 0; i < arr.length; i += 2) {
    build[arr[i]] = arr[i + 1];
  }

  return build;
}

// >>>
function list2dict(list) {
  // <<<
  return array2dict(parseTclList(list));
}

// >>>
function dict2list(dict) {
  // <<<
  let arr;
  arr = [];
  for (let i = 0; i < Object.keys(dict).length; i++) {
    let member = Object.keys(dict)[i];
    if (Object.prototype.hasOwnProperty.call(dict, member)) {
      arr.push(member);
      arr.push(dict[member]);
    }
  }
  return serializeTclList(arr);
}

// >>>

function toTcl(from) {
  // <<<
  let staged;

  switch (typeof from) {
    case 'boolean':
      return from ? '1' : '0';
    case 'function':
    case 'object':
      if (from instanceof types.TclObject) {
        return from.toString();
      }
      if (from instanceof Array) {
        staged = [];
        for (let i = 0; i < from.length; i++) {
          if (from[i] == null) continue;
          staged.push(quoteElem(toTcl(from[i])));
        }
        return staged.join(' ');
      }
      if (from instanceof String) {
        return from;
      }
      if (from instanceof Date) {
        return Math.floor(from.getTime() / 1000);
      }
      // hopefully a generic object or instance of Function
      staged = [];

      for (let i = 0; i < Object.keys(from).length; i++) {
        let e = Object.keys(from)[i];
        if (Object.prototype.hasOwnProperty.call(from, e) && from[e] != null) {
          staged.push(quoteElem(e));
          staged.push(quoteElem(toTcl(from[e])));
        }
      }
      return staged.join(' ');
    case 'number':
      return String(from);
    case 'string':
      return from;

    case null:
    case undefined:
      return '';

    default:
      throw new Error(`Cannot convert type: ${typeof from}`);
  }
}

// >>>
function complete(str) {
  // <<<
  try {
    parseTclList(str);
  } catch (err) {
    if (err instanceof IncompleteError) {
      return false;
    }
    if (err instanceof ParseError) {
      return false;
    }
    throw err;
  }
  return true;
}

// >>>

module.exports = {
  list2array: parseTclList,
  parse_tcl_list: parseTclList,
  array2list: serializeTclList,
  serialize_tcl_list: serializeTclList,
  array2dict,
  list2dict,
  dict2list,
  to_tcl: toTcl,
  complete,
  bool() {
    throw new Error('bool() has moved to utils');
  },
};

// vim: ft=javascript foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4
