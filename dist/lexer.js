(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./is"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Is = require("./is");
    function Lexer(input) {
        var pos = 0;
        var c = input.charAt(0);
        var wordIdx = 0;
        function read() {
            var val = c;
            pos += 1;
            c = input.charAt(pos);
            return val;
        }
        function skipWhitespace() {
            while (Is.Whitespace(c)) {
                read();
            }
        }
        function skipComment() {
            while (pos < input.length && c !== '\n') {
                read();
            }
        }
        function scanWord(delimiter) {
            var value = '';
            var hasVariable = false;
            var hasSubExpr = false;
            var index = wordIdx;
            var testEndOfWord = delimiter
                ? function (ch) { return ch === delimiter; }
                : Is.WordSeparator;
            while (pos < input.length && !testEndOfWord(c)) {
                hasVariable = delimiter !== '}' && (hasVariable || c === '$');
                hasSubExpr = delimiter !== '}' && (hasSubExpr || c === '[');
                value += read();
            }
            if (delimiter) {
                if (!testEndOfWord(c)) {
                    throw new Error('Parse error: unexpected end of input');
                }
                read();
            }
            wordIdx += 1;
            return new WordToken({ value: value, index: index, hasVariable: hasVariable, hasSubExpr: hasSubExpr });
        }
        function skipEndOfCommand() {
            while (Is.CommandDelimiter(c) || Is.Whitespace(c)) {
                read();
            }
            wordIdx = 0;
        }
        function nextToken() {
            skipWhitespace();
            if (pos >= input.length) {
                return null;
            }
            switch (true) {
                case wordIdx === 0 && c === '#':
                    skipComment();
                    return nextToken();
                case Is.CommandDelimiter(c):
                    skipEndOfCommand();
                    return nextToken();
                case c === '"':
                    read();
                    return scanWord('"');
                case c === '{':
                    read();
                    return scanWord('}');
                default:
                    return scanWord();
            }
        }
        return { nextToken: nextToken };
    }
    exports.Lexer = Lexer;
    var WordToken = (function () {
        function WordToken(attrs) {
            this.type = 'Word';
            this.hasVariable = false;
            Object.assign(this, attrs);
        }
        return WordToken;
    }());
    exports.WordToken = WordToken;
});
//# sourceMappingURL=lexer.js.map