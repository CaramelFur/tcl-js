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
    var LineLexer = (function () {
        function LineLexer(input) {
            this.pos = 0;
            this.wordIdx = 0;
            this.input = input;
            this.currentChar = input.charAt(0);
        }
        LineLexer.prototype.read = function () {
            var old = this.currentChar;
            this.pos += 1;
            this.currentChar = this.input.charAt(this.pos);
            return old;
        };
        LineLexer.prototype.skipWhitespace = function () {
            while (Is.Whitespace(this.currentChar)) {
                this.read();
            }
        };
        LineLexer.prototype.skipComment = function () {
            while (this.pos < this.input.length && this.currentChar !== '\n') {
                this.read();
            }
        };
        LineLexer.prototype.scanWord = function (delimiterIn) {
            var delimiters = [];
            if (delimiterIn)
                delimiters.push(delimiterIn);
            var out = {
                value: '',
                hasVariable: false,
                hasSubExpr: false,
                index: this.wordIdx,
            };
            function testDelimiters(test) {
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
                return 0;
            }
            function testEndOfWord(test) {
                if (delimiters.length > 0) {
                    var delimiter = delimiters[delimiters.length - 1];
                    if (test === delimiter) {
                        delimiters.pop();
                        if (delimiters.length === 0)
                            return EndWordType.END;
                        return EndWordType.POPPED;
                    }
                    return EndWordType.CONTINUE;
                }
                return Is.WordSeparator(test) ? EndWordType.END : EndWordType.CONTINUE;
            }
            while (this.pos < this.input.length) {
                var isEnd = testEndOfWord(this.currentChar);
                if (isEnd === EndWordType.END) {
                    this.read();
                    break;
                }
                out.hasVariable =
                    delimiters[0] !== '}' && (out.hasVariable || this.currentChar === '$');
                out.hasSubExpr =
                    delimiters[0] !== '}' && (out.hasSubExpr || this.currentChar === '[');
                if (isEnd !== EndWordType.POPPED) {
                    var newLength = testDelimiters(this.currentChar);
                    if (newLength === 1) {
                        this.read();
                        continue;
                    }
                }
                out.value += this.read();
            }
            if (delimiters.length > 0) {
                if (!testEndOfWord(this.currentChar)) {
                    console.log(delimiters);
                    throw new Error('Parse error: unexpected end of input');
                }
                this.read();
            }
            this.wordIdx += 1;
            return out;
        };
        LineLexer.prototype.skipEndOfCommand = function () {
            while (Is.CommandDelimiter(this.currentChar) ||
                Is.Whitespace(this.currentChar)) {
                this.read();
            }
            this.wordIdx = 0;
        };
        LineLexer.prototype.nextToken = function () {
            this.skipWhitespace();
            if (this.pos >= this.input.length) {
                return null;
            }
            switch (true) {
                case this.wordIdx === 0 && this.currentChar === '#':
                    this.skipComment();
                    return this.nextToken();
                case Is.CommandDelimiter(this.currentChar):
                    this.skipEndOfCommand();
                    return this.nextToken();
                default:
                    return this.scanWord();
            }
        };
        return LineLexer;
    }());
    exports.LineLexer = LineLexer;
    var EndWordType;
    (function (EndWordType) {
        EndWordType[EndWordType["CONTINUE"] = 0] = "CONTINUE";
        EndWordType[EndWordType["END"] = 1] = "END";
        EndWordType[EndWordType["POPPED"] = 2] = "POPPED";
    })(EndWordType || (EndWordType = {}));
});
//# sourceMappingURL=lexer.js.map