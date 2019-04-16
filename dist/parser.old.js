(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./lexer", "./is"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var lexer_1 = require("./lexer");
    var Is = require("./is");
    function skipWhitespace(input, start, includeNewlines) {
        if (includeNewlines === void 0) { includeNewlines = false; }
        var pos = start;
        var char = input.charAt(pos);
        while (pos < input.length &&
            (Is.Whitespace(char) || (includeNewlines && char === '\n'))) {
            pos += 1;
            char = input.charAt(pos);
        }
        return pos;
    }
    function skipComment(input, start) {
        var pos = skipWhitespace(input, start, true);
        var char = input.charAt(pos);
        if (char === '#') {
            while (pos < input.length && char !== '\n') {
                pos += 1;
                char = input.charAt(pos);
            }
            if (char === '\n') {
                pos += 1;
            }
        }
        return pos;
    }
    function parseCommand(input, start, isNested) {
        var node = {
            type: 'Command',
            value: '',
            start: 0,
            end: 0,
        };
        return node;
    }
    function parseOctal(input, start) {
        var pos = start;
        var char = input.charAt(pos);
        var result = '';
        while (pos < input.length && result.length <= 3 && Is.Octal(char)) {
            result += char;
            pos += 1;
            char = input.charAt(pos);
        }
        if (!result)
            return null;
        return {
            type: 'Octal',
            value: String.fromCharCode(parseInt(result, 8)),
            start: start,
            end: start + result.length - 1,
        };
    }
    exports.parseOctal = parseOctal;
    function parseHex(input, start, max) {
        var pos = start;
        var char = input.charAt(pos);
        var result = '';
        while (pos < input.length && result.length <= max && Is.Hex(char)) {
            result += char;
            pos += 1;
            char = input.charAt(pos);
        }
        if (!result)
            return null;
        return {
            type: 'Hex',
            value: String.fromCharCode(parseInt(result, 16)),
            start: start,
            end: start + result.length - 1,
        };
    }
    exports.parseHex = parseHex;
    function parseBackslash(input, start) {
        var char = input.charAt(start + 1);
        var result = char;
        var end = start + 1;
        switch (true) {
            case char === 'a':
                result = String.fromCharCode(7);
                break;
            case char === 'b':
                result = '\b';
                break;
            case char === 'f':
                result = '\f';
                break;
            case char === 'n':
                result = '\n';
                break;
            case char === 'r':
                result = '\r';
                break;
            case char === 't':
                result = '\t';
                break;
            case char === 'v':
                result = '\v';
                break;
            case char === 'x': {
                var hex = parseHex(input, start + 2, 2);
                if (hex) {
                    result = hex.value;
                    end = hex.end;
                }
                break;
            }
            case char === 'u': {
                var hex = parseHex(input, start + 2, 4);
                if (hex) {
                    result = hex.value;
                    end = hex.end;
                }
                break;
            }
            case char === 'U': {
                var hex = parseHex(input, start + 2, 8);
                if (hex) {
                    result = hex.value;
                    end = hex.end;
                }
                break;
            }
            case Is.Octal(char): {
                var octal = parseOctal(input, start + 1);
                if (octal) {
                    result = octal.value;
                    end = octal.end;
                }
                break;
            }
            default:
        }
        return {
            type: 'Backslash',
            value: result,
            start: start,
            end: end,
        };
    }
    exports.parseBackslash = parseBackslash;
    function parseQuotedString(input, start) { }
    function parseBraces(input, start) {
        var pos = start + 1;
        var char = input.charAt(pos);
        var level = 1;
        var result = '';
        var done = false;
        while (pos < input.length && !done) {
            switch (char) {
                case '{':
                    level += 1;
                    result += char;
                    break;
                case '}':
                    level -= 1;
                    if (level === 0) {
                        done = true;
                    }
                    else {
                        result += char;
                    }
                    break;
                case '\\': {
                    var bs = parseBackslash(input, pos);
                    result += bs.value === '\n' ? ' ' : bs.value;
                    pos = bs.end;
                    break;
                }
                default:
                    result += char;
            }
            pos += 1;
            char = input.charAt(pos);
        }
        if (level !== 0) {
            throw new Error('unmatched closing }');
        }
        return {
            type: 'Text',
            value: result,
            start: start,
            end: pos - 1,
        };
    }
    exports.parseBraces = parseBraces;
    function parseWords(input, start) {
        var pos = start;
        var c = input.charAt(pos);
        var subVars = c !== '{';
        var tokens = [];
        while (pos < input.length) { }
    }
    function Parse(input) {
        var lexer = lexer_1.Lexer(input);
        var token = lexer.nextToken();
        function nextToken() {
            var val = token;
            token = lexer.nextToken();
            return val;
        }
        function nextStatement() {
            if (token === null)
                return null;
            var node = {
                type: 'Statement',
                words: [nextToken()],
            };
            while (token !== null && token.index !== 0) {
                node.words.push(nextToken());
            }
            return node;
        }
        function program() {
            var node = {
                type: 'Program',
                statements: [],
            };
            var stmt = nextStatement();
            while (stmt) {
                node.statements.push(stmt);
                stmt = nextStatement();
            }
            return node;
        }
        return program();
    }
    exports.Parse = Parse;
});
//# sourceMappingURL=parser.old.js.map