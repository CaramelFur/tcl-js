(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./is", "./tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Is = require("./is");
    var tclerror_1 = require("./tclerror");
    var Lexer = (function () {
        function Lexer(input) {
            this.pos = 0;
            this.wordIdx = 0;
            this.input = input;
            this.currentChar = input.charAt(0);
        }
        Lexer.prototype.read = function () {
            var old = this.currentChar;
            this.pos += 1;
            this.currentChar = this.input.charAt(this.pos);
            return old;
        };
        Lexer.prototype.skipWhitespace = function () {
            while (Is.Whitespace(this.currentChar)) {
                this.read();
            }
        };
        Lexer.prototype.skipComment = function () {
            while (this.pos < this.input.length && this.currentChar !== '\n') {
                this.read();
            }
        };
        Lexer.prototype.scanWord = function (delimiterIn) {
            var delimiters = [];
            if (delimiterIn)
                delimiters.push(delimiterIn);
            var hasDelimiters = delimiters.length > 0;
            var out = {
                value: '',
                hasVariable: false,
                hasSubExpr: false,
                index: this.wordIdx,
            };
            function testOpenDelimiters(test) {
                switch (test) {
                    case '{':
                        delimiters.push('}');
                        return delimiters.length;
                    case '"':
                        delimiters.push('"');
                        return delimiters.length;
                    case '[':
                        delimiters.push(']');
                        return delimiters.length;
                }
                return -1;
            }
            function testCloseDelimiters(test) {
                if (test === delimiters[delimiters.length - 1]) {
                    delimiters.pop();
                    return delimiters.length;
                }
                return -1;
            }
            function testEndOfWord(test) {
                if (delimiters.length > 0) {
                    return false;
                }
                return Is.WordSeparator(test);
            }
            while (this.pos < this.input.length) {
                if (out.value === '' || hasDelimiters) {
                    var closing = testCloseDelimiters(this.currentChar);
                    if (closing !== -1) {
                        if (closing === 0) {
                            this.read();
                            continue;
                        }
                    }
                    else {
                        var opening = testOpenDelimiters(this.currentChar);
                        if (opening > 0)
                            hasDelimiters = true;
                        if (opening === 1) {
                            this.read();
                            continue;
                        }
                    }
                }
                if (testEndOfWord(this.currentChar))
                    break;
                if (hasDelimiters && delimiters.length === 0)
                    throw new tclerror_1.TclError('extra characters after close-brace');
                out.hasVariable =
                    delimiters.indexOf('}') < 0 &&
                        delimiters.indexOf(']') < 0 &&
                        (out.hasVariable || this.currentChar === '$');
                out.hasSubExpr =
                    delimiters.indexOf('}') < 0 &&
                        (out.hasSubExpr || delimiters[0] === ']');
                out.value += this.read();
            }
            if (delimiters.length > 0)
                throw new tclerror_1.TclError('parse error: unexpected end of input');
            this.wordIdx += 1;
            return out;
        };
        Lexer.prototype.skipEndOfCommand = function () {
            while (Is.WordSeparator(this.currentChar)) {
                this.read();
            }
        };
        Lexer.prototype.nextToken = function () {
            this.skipWhitespace();
            if (this.pos >= this.input.length) {
                return null;
            }
            if (this.wordIdx === 0 && this.currentChar === '#') {
                this.skipComment();
                return this.nextToken();
            }
            else if (Is.CommandDelimiter(this.currentChar)) {
                this.skipEndOfCommand();
                this.wordIdx = 0;
                return this.nextToken();
            }
            else {
                return this.scanWord();
            }
        };
        return Lexer;
    }());
    exports.Lexer = Lexer;
    var EndWordType;
    (function (EndWordType) {
        EndWordType[EndWordType["CONTINUE"] = 0] = "CONTINUE";
        EndWordType[EndWordType["END"] = 1] = "END";
        EndWordType[EndWordType["POPPED"] = 2] = "POPPED";
    })(EndWordType || (EndWordType = {}));
});
//# sourceMappingURL=lexer.js.map