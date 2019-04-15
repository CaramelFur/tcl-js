const types = require('./types');

let iface;
let TEXT = 0;
let SPACE = 1;
let VAR = 2;
let ARRAY = 3;
let INDEX = 4;
let ESCAPE = 5;
let END = 6;
let SCRIPT = 7;
let COMMENT = 8;
let EXPAND = 9;
let SYNTAX = 10;
let OPERAND = 11;
let OPERATOR = 12;
let LPAREN = 13;
let RPAREN = 14;
let FLOAT = 15;
let INTEGER = 16;
let MATHFUNC = 17;
let BOOL = 18;
let EXPR = 19;
let ARG = 20;
let QUOTED = 21;
let BRACED = 22;
let SCRIPTARG = 24;
let EXPRARG = 25;
let SUBSTARG = 26;
// SWITCHARG = 27,  No longer used - switch parses to LISTARG now
let LISTARG = 28;
let t = {
  TEXT,
  SPACE,
  VAR,
  ARRAY,
  INDEX,
  ESCAPE,
  END,
  SCRIPT,
  COMMENT,
  EXPAND,
  SYNTAX,

  OPERAND,
  OPERATOR,
  LPAREN,
  RPAREN,
  FLOAT,
  INTEGER,
  MATHFUNC,
  BOOL,
  EXPR,
  ARG,
  QUOTED,
  BRACED,

  SCRIPTARG,
  EXPRARG,
  SUBSTARG,
  LISTARG,
};
let operators = [
  /^(?:~|!(?=[^=]))/,
  1,
  /^\*\*/,
  2,
  /^[*\/%]/,
  2,
  /^[\-+]/,
  2,
  /^(?:<<|>>)/,
  2,
  /^(?:<=|>=)/,
  2,
  /^(?:<|>)/,
  2, // Technically the same precedence as above, but the above needs to be matched against first
  /^(?:==|!=)/,
  2,
  /^(?:ne|eq)/,
  2,
  /^(?:in|ni)/,
  2,
  /^&(?!&)/,
  2,
  /^\^/,
  2,
  /^\|(?!\|)/,
  2,
  /^&&/,
  2,
  /^\|\|/,
  2,
  /^[?:]/,
  3,
];

function findLineNo(source, ofs) {
  let line = source.substr(0, ofs).replace(/[^\n]+/g, '').length;
  return line + 1;
}

function findLineOfs(source, ofs) {
  return ofs - source.lastIndexOf('\n', ofs);
}

function visualizeWhitespace(str) {
  return str.replace(/\n/g, '\u23ce').replace(/\t/g, '\u21e5');
}

function ParseError(message, charnum, source, ofs) {
  this.name = 'ParseError';
  this.message = message;
  this.line_no = findLineNo(source, charnum);
  this.line_ofs = findLineOfs(source, charnum);
  this.pretty_print = function (fullsource) {
    let preambleLen = Math.min(charnum, 20);
    let lineNo = findLineNo(fullsource, charnum + ofs);
    let lineOfs = findLineOfs(fullsource, charnum + ofs);
    return `Parse error: ${message} at line ${lineNo}, character ${lineOfs}\n\t${visualizeWhitespace(
      fullsource.substr(charnum + ofs - preambleLen, preambleLen + 20),
    )}\n\t${new Array(preambleLen + 1).join('.')}^`;
  };
  this.char = charnum;
  this.ofs = ofs || 0;
}
ParseError.prototype = new Error();

function wordEmpty(tokens) {
  let i;
  for (i = 0; i < tokens.length; i++) {
    switch (tokens[i][0]) {
      case TEXT:
      case ESCAPE:
      case VAR:
      case ARRAY:
      // case INDEX: // Can't have INDEX without ARRAY
      case SCRIPT:
      case EXPAND:
        return false;
      default:
    }
  }
  return true;
}

function allScriptTokens(commands) {
  let i;
  let j;
  let k;
  let command;
  let word;
  let tokens = [];

  for (i = 0; i < commands.length; i++) {
    command = commands[i];
    for (j = 0; j < command.length; j++) {
      word = command[j];
      for (k = 0; k < word.length; k++) {
        tokens.push(word[k]);
      }
    }
  }
  return tokens;
}

function parse(text, mode, ofs) {
  let word;
  let i = 0;
  let token = '';
  let tokens = [];
  let lasttoken;
  let command = [];
  let commands = [];
  let matches;
  let tokstart = ofs != null ? ofs : 0;

  function toklength(tok) {
    let len;
    let tokens2;
    switch (tok[0]) {
      case INDEX:
        len = 0;
        for (let j = 0; j < tok[1].length; j++) {
          len += toklength(tok[1][j]);
        }
        return len;

      case SCRIPT:
        tokens2 = allScriptTokens(tok[1]);
        len = 0;
        for (let j = 0; j < tokens2.length; j++) {
          len += toklength(tokens2[j]);
        }
        return len;

      default:
        return tok[1].length;
    }
  }

  function emit(tok) {
    tok[3] = tokstart;
    tokstart += toklength(tok);
    tokens.push(tok);
    token = '';
  }

  function emitWaiting(type) {
    if (token) {
      emit([type, token]);
    }
  }

  function parseEscape() {
    let escapechars;
    let first = i;
    i += 1;

    function literal(crep, len) {
      let last = first + (len === undefined ? 1 : len);
      emitWaiting(TEXT);
      emit([ESCAPE, text.substr(first, last - first + 1), crep]);
      i = last + 1;
    }

    function charcode(code, len) {
      literal(String.fromCharCode(code), len);
    }
    let toSwitch = text[i];
    i += 1;

    switch (toSwitch) {
      case undefined:
        token += '\\';
        break;

      case 'a':
        charcode(0x7);
        break;
      case 'b':
        charcode(0x8);
        break;
      case 'f':
        charcode(0xc);
        break;
      case 'n':
        charcode(0xa);
        break;
      case 'r':
        charcode(0xd);
        break;
      case 't':
        charcode(0x9);
        break;
      case 'v':
        charcode(0xb);
        break;

      case 'x':
        matches = text.substr(i).match(/^[0-9A-Fa-f]+/);
        if (matches !== null) {
          escapechars = matches[0];
          charcode(parseInt(escapechars, 16) % 0xff, escapechars.length + 1);
        } else {
          literal('x');
        }
        break;

      case 'u':
        matches = text.substr(i).match(/^[0-9A-Fa-f]{1,4}/);
        if (matches !== null) {
          escapechars = matches[0];
          charcode(parseInt(escapechars, 16), escapechars.length + 1);
        } else {
          literal('u');
        }
        break;

      case '\n':
        // Line folding
        matches = text.substr(i).match(/^[ \t]*/);
        literal(' ', matches !== null ? matches[0].length + 1 : 1);
        break;

      default:
        i -= 1;
        matches = text.substr(i).match(/^[0-7]{1,3}/);
        if (matches !== null) {
          escapechars = matches[0];
          charcode(parseInt(escapechars, 8), escapechars.length);
        } else {
          literal(text[i]);
        }
        break;
    }
  }

  function parseCommands() {
    let word2;
    let lasttoken2;
    let savetokens;
    let savetokstart;
    let command2 = [];
    let commands2 = [];

    emitWaiting(TEXT);
    emit([SYNTAX, text[i]]);
    i += 1;
    savetokstart = tokstart;
    while (true) {
      savetokens = tokens.slice();
      word2 = getWord(command2.length === 0, true);
      tokens = savetokens;
      command2.push(word2);
      lasttoken2 = word2[word2.length - 1];
      if (lasttoken2 == null) {
        throw new ParseError('Cannot find end of command', i, text, ofs);
      }
      if (lasttoken2[0] === END) {
        commands2.push(command2);
        command2 = [];
        if (lasttoken2[1] === ']' || lasttoken2[1] === '') {
          break;
        }
      }
    }
    tokstart = savetokstart;
    emit([SCRIPT, commands2]);
  }

  function parseVariable() {
    let idx;
    let saveI;

    if (!/^([a-zA-Z0-9_{(]|::)/.test(text.substr(i + 1, 2))) {
      token += text[i];
      i += 1;
      return;
    }

    emitWaiting(TEXT);
    emit([SYNTAX, text[i]]);
    i += 1;
    function parseIndex() {
      let savedTokens;
      let savedTokstart;
      let indextokens;
      // escape, variable and command substs apply here
      emit([SYNTAX, text[i]]);
      i += 1;
      savedTokens = tokens.slice(0);
      savedTokstart = tokstart;
      tokens = [];
      while (true) {
        switch (text[i]) {
          case undefined:
            throw new ParseError('missing )', i, text, ofs);

          case ')':
            emitWaiting(TEXT);
            indextokens = tokens.slice(0);
            tokens = savedTokens;
            tokstart = savedTokstart;
            emit([INDEX, indextokens]);
            emit([SYNTAX, text[i]]);
            i += 1;
            return;

          case '\\':
            parseEscape();
            break;
          case '$':
            parseVariable();
            break;
          case '[':
            parseCommands();
            break;

          default:
            token += text[i];
            i += 1;
            break;
        }
      }
    }

    if (text[i] === '{') {
      emit([SYNTAX, text[i]]);
      i += 1;
      idx = text.indexOf('}', i);
      if (idx === -1) {
        throw new ParseError(
          'missing close-brace for variable name',
          i,
          text,
          ofs,
        );
      }
      token = text.substr(i, idx - i);
      i += idx - i;

      idx = token.lastIndexOf('(');
      if (token[token.length - 1] === ')' && idx !== -1) {
        saveI = i;
        i -= token.length;
        token = token.substr(0, idx);
        i += token.length;
        emit([ARRAY, token]);
        parseIndex();
        i = saveI;
      } else {
        emit([VAR, token]);
      }
      emit([SYNTAX, text[i]]);
      i += 1;
    } else {
      token = text.substr(i).match(/^[a-zA-Z_0-9:]*/)[0];
      // : alone is a name terminator
      idx = token.replace(/::/g, '__').indexOf(':');
      if (idx > 0) {
        token = token.substr(0, idx);
      }
      i += token.length;
      if (text[i] !== '(') {
        emit([VAR, token]);
      } else {
        emit([ARRAY, token]);
        parseIndex();
      }
    }
  }

  function parseBraced() {
    let depth = 1;
    let m;
    let from;
    let emitted = false;
    emit([SYNTAX, text[i]]);
    i += 1;
    from = i;

    function emitFold(len) {
      emit([ESCAPE, text.substr(i, len), ' ']);
      i += len;
      from = i;
    }

    while (depth) {
      m = text.substr(i).match(/(\\*?)?(?:(\{|\})|(\\\n[ \t]*))/);
      if (m === null) {
        throw new ParseError('missing close-brace', i - 1, text, ofs);
      }
      if (m[1] !== undefined && m[1].length % 2 === 1) {
        // The text we found was backquoted, move along
        i += m.index + m[0].length;
        continue;
      }
      i += m.index + (m[1] !== undefined ? m[1].length : 0);
      if (m[3] !== undefined) {
        // line fold
        if (i > from) {
          emit([TEXT, text.substr(from, i - from)]);
        }
        emitFold(m[3].length);
        emitted = true;
      } else {
        if (m[2].charAt(0) === '{') {
          depth += 1;
        } else {
          depth -= 1;
        }
        i += 1;
      }
    }
    i -= 1;
    if (!emitted || i > from) {
      emit([TEXT, text.substr(from, i - from)]);
    }
    emit([SYNTAX, text[i]]);
    i += 1;
    return tokens;
  }

  function parseCombined(quoted, incmdsubst, ignoreTrailing) {
    let matched;
    let start = i;

    if (quoted) {
      emit([SYNTAX, text[i]]);
      i += 1;
    }

    while (true) {
      matched = true;

      if (quoted) {
        switch (text[i]) {
          case undefined:
            throw new ParseError('missing "', start, text, ofs);

          case '"':
            if (
              !ignoreTrailing &&
              text[i + 1] !== undefined &&
              text.substr(i + 1, 2) !== '\\\n' &&
              !(incmdsubst ? /[\s;\]]/ : /[\s;]/).test(text[i + 1])
            ) {
              let lineno = text.substr(0, i).replace(/[^\n]+/, '').length;
              console.log(
                `i: ${i}, (${text.substr(
                  0,
                  100,
                )}) line: ${lineno}: ${text.substr(i - 5, 10)}`,
              );
              throw new ParseError(
                'extra characters after close-quote',
                i + 1,
                text,
                ofs,
              );
            }
            if (i === start + 1) {
              // Need to manually emit rather than using
              // emit_waiting because we still need it if
              // token === ''
              emit([TEXT, token]);
            } else {
              emitWaiting(TEXT);
            }
            emit([SYNTAX, text[i]]);
            i += 1;
            return tokens;

          default:
            matched = false;
        }
      } else {
        switch (text[i]) {
          case undefined:
            emitWaiting(TEXT);
            emit([END, '']);
            return tokens;

          case '\n':
          case ';':
            emitWaiting(TEXT);
            token = text[i];
            i += 1;
            emit([END, token]);
            return tokens;

          case '\\':
            if (text[i + 1] !== '\n') {
              matched = false;
              break;
            }
          // Line fold - falls through
          case ' ':
          case '\t':
            emitWaiting(TEXT);
            return tokens;

          default:
            matched = false;
        }
      }

      if (!matched) {
        switch (text[i]) {
          case '\\':
            parseEscape();
            break;

          case '$':
            parseVariable();
            break;

          case '[':
            parseCommands();
            break;

          case ']':
            if (incmdsubst && !quoted) {
              emitWaiting(TEXT);
              token = text[i];
              i += 1;
              emit([END, token]);
              return tokens;
            }
          // Falls through
          default:
            token += text[i];
            i += 1;
            break;
        }
      }
    }
  }

  function getWord(first, incmdsubst) {
    let re;
    let m;

    tokens = [];
    token = '';
    re = first ?
      /^(?:[\t \n]*\\\n[\t \n]*)|^[\t \n]+/ :
      /^(?:[\t ]*\\\n[\t ]*)|^[\t ]+/;

    // Consume any leading whitespace / comments if first word
    m = re.exec(text.substr(i));
    while ((first && text[i] === '#') || m) {
      if (m) {
        token += m[0];
        i += m[0].length;
      }
      emitWaiting(SPACE);
      if (first && text[i] === '#') {
        while (text[i] !== undefined) {
          if (text[i] === '\\' && i < text.length - 1) {
            token += text[i];
            i += 1;
          }
          token += text[i];
          i += 1;
          if (text[i] === '\n') {
            token += text[i];
            i += 1;
            break;
          }
        }
        emit([COMMENT, token]);
      }
      m = null;
    }

    // handle {*}
    if (text[i] === '{' && text.substr(i, 3) === '{*}') {
      emit([EXPAND, '{*}']);
      i += 3;
    }

    switch (text[i]) {
      case undefined:
        return tokens;
      case '{':
        return parseBraced();
      case '"':
        return parseCombined(true, incmdsubst);
      case ']':
        if (incmdsubst) {
          emit([END, text[i]]);
          i += 1;
          return tokens;
        }
      // Falls through to default
      default:
        return parseCombined(false, incmdsubst);
    }
  }

  function parseSubexpr(funcargs) {
    let here;
    let m;
    let found;
    let j;
    let expectingOperator = false;

    function emitToken(type, valueArg, subtype, crep) {
      let value = valueArg;
      if (value === undefined) {
        value = '';
      }
      if (value.length === 0 && type !== END) {
        throw new ParseError(
          'Refusing to emit a token of length 0',
          i,
          text,
          ofs,
        );
      }
      tokens.push([type, subtype, crep, value]);
      tokstart += value.length;
      i += value.length;
    }

    function parseQuoted() {
      parseCombined(true, false, true);
    }

    function subParse(subtoken, func, makeCrep) {
      let sTokens = tokens.slice();
      let sTokstart = tokstart;
      let sI = i;
      let eI;
      let crep;
      let subtokens;
      tokens = [];
      func();
      subtokens = tokens.slice();
      eI = i;
      tokens = sTokens;
      tokstart = sTokstart;
      i = sI;
      crep = makeCrep ? makeCrep(subtokens) : subtokens;
      emitToken(OPERAND, text.substr(i, eI - i), subtoken, crep);
    }

    function subParseArg() {
      let sTokens = tokens.slice();
      let sI = i;
      let eI;
      let subtokens;
      tokens = [];
      parseSubexpr(true);
      subtokens = tokens;
      tokens = sTokens;
      eI = i;
      i = sI;
      emitToken(ARG, text.substr(i, eI - i), EXPR, subtokens);
      return subtokens[subtokens.length - 1][3];
    }

    function parseMathfunc(funcname, space) {
      let sI = i;
      let eI;
      let sTokens = tokens.slice();
      let term;
      let subtokens;
      tokens = [];
      emitToken(MATHFUNC, funcname);
      if (space) {
        emitToken(SPACE, space);
      }
      emitToken(SYNTAX, '(');
      do {
        term = subParseArg();
      } while (term === ',');
      subtokens = tokens;
      tokens = sTokens;
      eI = i;
      i = sI;
      emitToken(OPERAND, text.substr(i, eI - i), MATHFUNC, subtokens);
    }

    while (text[i] !== undefined) {
      here = text.substr(i);
      // line folds
      m = /^\\\n\s+/.exec(here);
      if (m) {
        emitToken(SPACE, m[0]);
        continue;
      }

      // whitespace
      m = /^\s+/.exec(here);
      if (m) {
        emitToken(SPACE, m[0]);
        continue;
      }

      if (!expectingOperator) {
        // Unitary + and -
        m = /[\-+]/.exec(text[i]);
        if (m) {
          emitToken(OPERATOR, m[0], 0, 1);
          continue;
        }
      }

      // operators, in decreasing precedence
      found = false;
      for (j = 0; j < operators.length; j += 2) {
        m = operators[j].exec(here);
        if (m) {
          emitToken(OPERATOR, m[0], j, operators[j + 1]);
          found = true;
          expectingOperator = false;
          break;
        }
      }
      if (found) {
        continue;
      }

      expectingOperator = true;

      // number
      m = /^(?:([\-+]?)(Inf(?:inity)?)|(NaN))\b/i.exec(here);
      if (m) {
        if (/n/i.test(m[0][1])) {
          emitToken(OPERAND, m[0], FLOAT, NaN);
        } else {
          emitToken(OPERAND, m[0], FLOAT, Number(`${m[1]}Infinity`));
        }
        continue;
      }
      m = /^([\-+])?(0x)([\dA-F]+)/i.exec(here) ||
        /^([\-+])?(0b)([01]+)/i.exec(here) ||
        /^([\-+])?(0o)([0-7]+)/i.exec(here);
      if (m) {
        // TODO: Bignum support
        emitToken(
          OPERAND,
          m[0],
          INTEGER,
          parseInt(
            (m[1] || '') + m[3],
            {
              '': 10,
              '0x': 16,
              '0b': 2,
              '0o': 8,
            }[m[2]],
          ),
        );
        continue;
      }

      m = /^[\-+]?\d+(?:(\.)(?:\d+)?)?(e[\-+]?\d+)?/i.exec(here) ||
        /^[\-+]?(\.)\d+(e[\-+]?\d+)?/i.exec(here);

      if (m) {
        if (m[1] === undefined && m[2] === undefined) {
          emitToken(OPERAND, m[0], INTEGER, Number(m[0]));
        } else {
          emitToken(OPERAND, m[0], FLOAT, Number(m[0]));
        }
        continue;
      }

      switch (text[i]) {
        case undefined:
          throw new ParseError('missing operand', i, text, ofs);

        case '"':
          subParse(QUOTED, parseQuoted);
          continue;
        case '{':
          subParse(BRACED, parseBraced);
          continue;
        case '$':
          subParse(VAR, parseVariable, (tokens2) => {
            let k;
            let array;
            let index;
            for (k = 0; k < tokens2.length; k++) {
              switch (tokens2[k][0]) {
                case VAR:
                  return [tokens2[k][1]];
                case ARRAY:
                  array = tokens2[k][1];
                  break;
                case INDEX:
                  index = tokens2[k][1];
                  if (index.length === 1 && index[0][0] === TEXT) {
                    // Optimize the common case where the
                    // index is a simple string
                    return [array, index[0][1]];
                  }
                  // Index needs runtime resolution
                  return [array, tokens2[k][1]];
                default:
              }
            }
            throw new ParseError('No variable found', i, text, ofs);
          });
          continue;
        case '[':
          subParse(SCRIPT, parseCommands, (tokens2) => {
            for (let k = 0; k < tokens2.length; k++) {
              if (tokens2[k][0] === SCRIPT) {
                return tokens2[k];
              }
              if (tokens2[k][0] === SYNTAX) {
                // Dirty hack to inject the [ syntax token
                emitToken(SYNTAX, tokens2[k][1]);
              }
            }
            throw new ParseError('No script found', i, text, ofs);
          });
          continue;
        case '(':
          emitToken(LPAREN, text[i]);
          continue;
        case ')':
          if (funcargs) {
            emitToken(SYNTAX, text[i]);
            return;
          }
          emitToken(RPAREN, text[i]);
          continue;
        default:
      }
      if (funcargs) {
        if (text[i] === ',') {
          emitToken(SYNTAX, text[i]);
          return;
        }
      }
      // mathfunc
      m = /^(\w+)(\s*)?\(/.exec(here);
      if (m) {
        parseMathfunc(m[1], m[2]);
        continue;
      }
      // boolean
      m = /^(?:tr(?:ue?)?|yes?|on)\b/i.exec(here);
      if (m) {
        emitToken(OPERAND, m[0], BOOL, true);
        continue;
      }
      m = /^(?:fa(?:l(?:se?)?)?|no|off?)\b/i.exec(here);
      if (m) {
        emitToken(OPERAND, m[0], BOOL, false);
        continue;
      }
      // invalid bareword
      m = /^\w+\b/.exec(here);
      if (m) {
        throw new types.TclError(`invalid bareword "${m[0]}"`, [
          'TCL',
          'PARSE',
          'EXPR',
          'BAREWORD',
        ]);
      }
      console.log(`Cannot parse expression portion: "${here}"`);
      throw new types.TclError(`Cannot parse expression portion: "${here}"`, [
        'TCL',
        'PARSE',
        'EXPR',
        'GIVEUP',
      ]);
    }
  }

  function parseListElement(cx) {
    let start = i;
    let depth = 1;

    if (cx != null) {
      emit([SYNTAX, text[i]]);
      i += 1;
    }

    function isWhitespace(c) {
      switch (c) {
        case undefined:
        case '\t':
        case '\n':
        case '\v':
        case '\f':
        case '\r':
        case ' ': // Definitive whitespace list from http://tip.tcl.tk/407
          return true;
        default:
      }

      return false;
    }

    while (true) {
      if (cx === '"') {
        switch (text[i]) {
          case undefined:
            throw new ParseError('missing "', start, text, ofs);

          case '"':
            if (!isWhitespace(text[i + 1])) {
              throw new ParseError(
                `list element in quotes followed by "${
                  text[i + 1]
                }" instead of space`,
                i + 1,
                text,
                ofs,
              );
            }
            emitWaiting(TEXT);
            emit([SYNTAX, text[i]]);
            i += 1;
            return tokens;
          default:
        }
      } else if (cx === '{') {
        switch (text[i]) {
          case undefined:
            throw new ParseError('missing }', start, text, ofs);

          case '{':
            depth += 1;
            break;

          case '}':
            depth -= 1;
            if (depth === 0) {
              if (!isWhitespace(text[i + 1])) {
                throw new ParseError(
                  `list element in braces followed by "${
                    text[i + 1]
                  }" instead of space`,
                  i + 1,
                  text,
                  ofs,
                );
              }
              emitWaiting(TEXT);
              emit([SYNTAX, text[i]]);
              i += 1;
              return tokens;
            }
            break;
          default:
        }
      } else if (isWhitespace(text[i])) {
        emitWaiting(TEXT);
        return tokens;
      }

      if (text[i] == '\\') {
        if (cx === '{') {
          token += text[i];
          i += 1;
          if (text[i] === undefined) {
            throw new ParseError('missing }', start, text, ofs);
          }
          token += text[i];
          i += 1;
        } else {
          parseEscape();
        }
      } else {
        token += text[i];
        i += 1;
      }
    }
  }

  function tokenizeList() {
    let m;
    let cx;

    while (true) {
      m = /^[\t\n\v\f\r ]+/.exec(text.substr(i));
      if (m) {
        emit([SPACE, m[0]]);
        i += m[0].length;
      }

      switch (text[i]) {
        case undefined:
          return tokens;

        case '{':
        case '"':
          cx = text[i];
          break;

        default:
          cx = null;
          break;
      }

      parseListElement(cx);
    }
  }

  switch (mode) {
    case 'script':
      while (i < text.length) {
        word = getWord(command.length === 0, false);
        if (
          i >= text.length &&
          word.length &&
          word[word.length - 1][0] !== END
        ) {
          word.push([END, '', null, i]);
        }
        if (command.length > 1 && wordEmpty(word)) {
          // Prevent a fake word being added to the command only
          // containing non-word tokens
          Array.prototype.push.apply(command[command.length - 1], word);
        } else {
          command.push(word);
        }
        lasttoken = word[word.length - 1];
        if (lasttoken[0] === END) {
          commands.push(command);
          command = [];
        }
      }
      return [SCRIPT, commands, undefined, 0];
    case 'expr':
      parseSubexpr();
      return tokens;
    case 'list':
      tokenizeList();
      return tokens;
    case 'subst':
      while (i < text.length) {
        switch (text[i]) {
          case '\\':
            parseEscape();
            break;

          case '$':
            parseVariable();
            break;

          case '[':
            parseCommands();
            break;

          default:
            token += text[i];
            i += 1;
            break;
        }
      }
      emitWaiting(TEXT);
      return tokens;
    default:
      throw new Error(`Invalid parse mode: "${mode}"`);
  }
}

function parseScript(text, ofs) {
  // First unfold - happens even in brace quoted words
  // This has been pushed down to parse_escape, parse_braced and parse_subexpr
  // text = text.replace(/\\\n\s*/g, ' ');
  return parse(text, 'script', ofs);
}

function parseExpr(text, ofs) {
  return parse(text, 'expr', ofs);
}

function parseList(text, ofs) {
  return parse(text, 'list', ofs);
}

function parseSubst(text, ofs) {
  return parse(text, 'subst', ofs);
}

function expr2stack(expr) {
  // Algorithm from Harry Hutchins http://faculty.cs.niu.edu/~hutchins/csci241/eval.htm
  let P = [];
  let i;
  let stack = [];
  let item;

  for (i = 0; i < expr.length; i++) {
    switch (expr[i][0]) {
      case OPERAND:
        P.push(expr[i]);
        break;
      case LPAREN:
        stack.push(expr[i]);
        break;
      case RPAREN:
        if (stack.length === 0) {
          throw new Error('Unbalanced close parenthesis in expression');
        }
        while (stack.length) {
          item = stack.pop();
          if (item[0] === LPAREN) {
            break;
          }
          P.push(item);
        }
        break;
      case OPERATOR:
        if (stack.length === 0 || stack[stack.length - 1][0] === LPAREN) {
          stack.push(expr[i]);
        } else {
          item = stack[stack.length - 1];
          while (
            stack.length &&
            (item)[0] !== LPAREN &&
            expr[i][1] > item[1]
          ) {
            P.push(stack.pop());
            item = stack[stack.length - 1];
          }
          stack.push(expr[i]);
        }
        break;
      case SYNTAX:
      case SPACE:
        break;
      default:
        if (console !== undefined) {
          console.warn('Ignoring expr item:', expr[i]);
        }
    }
  }
  if (stack.length && stack[stack.length - 1][0] === LPAREN) {
    throw new Error('Unbalanced open parenthesis in expression');
  }
  while (stack.length) {
    P.push(stack.pop());
  }
  return P;
}

iface = {
  parse_script: parseScript,
  parse_expr: parseExpr,
  parse_list: parseList,
  parse_subst: parseSubst,
  expr2stack,
  ParseError,
  tokenname: {},
  find_line_no: findLineNo,
  find_line_ofs: findLineOfs,
};

for (let i = 0; i < Object.keys(t).length; i++) {
  let e = Object.keys(t)[i];
  if (Object.prototype.hasOwnProperty.call(t, e)) {
    iface[e] = t[e];
    iface.tokenname[t[e]] = e;
  }
}
module.exports = iface;
