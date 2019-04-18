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
        var currentChar = input.charAt(0);
        var wordIdx = 0;
        function read() {
            var val = currentChar;
            pos += 1;
            currentChar = input.charAt(pos);
            return val;
        }
        function skipWhitespace() {
            while (Is.Whitespace(currentChar)) {
                read();
            }
        }
        function skipComment() {
            while (pos < input.length && currentChar !== '\n') {
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
            while (pos < input.length && !testEndOfWord(currentChar)) {
                hasVariable = delimiter !== '}' && (hasVariable || currentChar === '$');
                hasSubExpr = delimiter !== '}' && (hasSubExpr || currentChar === '[');
                value += read();
            }
            if (delimiter) {
                if (!testEndOfWord(currentChar)) {
                    throw new TclError('Parse error: unexpected end of input');
                }
                read();
            }
            wordIdx += 1;
            return new WordToken({ value: value, index: index, hasVariable: hasVariable, hasSubExpr: hasSubExpr });
        }
        function skipEndOfCommand() {
            while (Is.CommandDelimiter(currentChar) || Is.Whitespace(currentChar)) {
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
                case wordIdx === 0 && currentChar === '#':
                    skipComment();
                    return nextToken();
                case Is.CommandDelimiter(currentChar):
                    skipEndOfCommand();
                    return nextToken();
                case currentChar === '"':
                    read();
                    return scanWord('"');
                case currentChar === '{':
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
//# sourceMappingURL=lexer.old.js.map
