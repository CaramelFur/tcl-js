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
            this.currentSentence = '';
            this.currentLine = 0;
            this.input = input;
            this.currentChar = this.input.charAt(0);
        }
        Lexer.prototype.read = function () {
            var _this = this;
            var old = this.currentChar;
            var subRead = function () {
                _this.pos += 1;
                _this.currentChar = _this.input.charAt(_this.pos);
                _this.currentSentence += old;
                if (old === '\n')
                    _this.currentLine += 1;
            };
            subRead();
            if (this.currentChar === '\\' && this.input.charAt(this.pos + 1) === '\n') {
                subRead();
                this.currentChar = ' ';
                while (Is.WordSeparator(this.input.charAt(this.pos + 1))) {
                    subRead();
                }
            }
            return old;
        };
        Lexer.prototype.hasMoreChars = function () {
            if (Is.WordSeparator(this.currentChar))
                return false;
            if (this.currentChar === '')
                return false;
            return true;
        };
        Lexer.prototype.readWhitespace = function () {
            while (Is.Whitespace(this.currentChar)) {
                this.read();
            }
        };
        Lexer.prototype.readComment = function () {
            while (this.pos < this.input.length && this.currentChar !== '\n') {
                this.read();
            }
        };
        Lexer.prototype.readEndOfCommand = function () {
            while (Is.WordSeparator(this.currentChar)) {
                this.read();
            }
        };
        Lexer.prototype.nextToken = function () {
            var token = this.getNextToken();
            if (token) {
                token.source = this.currentSentence;
                token.sourceLocation = this.currentLine;
            }
            return token;
        };
        Lexer.prototype.getNextToken = function () {
            this.readWhitespace();
            if (this.pos >= this.input.length) {
                return null;
            }
            switch (true) {
                case this.wordIdx === 0 && this.currentChar === '#':
                    this.readComment();
                    return this.nextToken();
                case Is.CommandDelimiter(this.currentChar):
                    this.readEndOfCommand();
                    this.wordIdx = 0;
                    this.currentSentence = '';
                    return this.nextToken();
                case this.currentChar === '{': {
                    var word = this.nextBraceWord();
                    word.stopBackslash = true;
                    return word;
                }
                case this.currentChar === '"':
                    return this.nextQuoteWord();
                default:
                    return this.nextSimpleWord();
            }
        };
        Lexer.prototype.nextBraceWord = function () {
            var out = this.newWordToken();
            var depth = 0;
            while (this.pos < this.input.length) {
                if (this.currentChar === '}') {
                    depth--;
                    if (depth === 0) {
                        this.read();
                        break;
                    }
                }
                if (this.currentChar === '{') {
                    depth++;
                    if (depth === 1) {
                        this.read();
                        continue;
                    }
                }
                if (depth === 0)
                    break;
                if (this.currentChar === '\\')
                    out.value += this.read();
                out.value += this.read();
            }
            if (depth !== 0)
                throw new tclerror_1.TclError('uneven amount of curly braces');
            if (this.hasMoreChars())
                throw new tclerror_1.TclError('extra characters after close-brace');
            return out;
        };
        Lexer.prototype.nextQuoteWord = function () {
            this.read();
            var out = this.newWordToken();
            while (this.pos < this.input.length && this.currentChar !== '"') {
                if (this.currentChar === '[') {
                    out.value += this.readBrackets();
                    out.hasSubExpr = true;
                    out.hasVariable = true;
                    continue;
                }
                if (this.currentChar === '$') {
                    out.value += this.readVariable();
                    out.hasSubExpr = true;
                    out.hasVariable = true;
                    continue;
                }
                if (this.currentChar === '\\')
                    out.value += this.read();
                out.value += this.read();
            }
            var close = this.read();
            if (close !== '"')
                throw new tclerror_1.TclError('missing "');
            if (this.hasMoreChars())
                throw new tclerror_1.TclError('extra characters after close-quote');
            this.wordIdx += 1;
            return out;
        };
        Lexer.prototype.nextSimpleWord = function () {
            var out = this.newWordToken();
            while (this.pos < this.input.length &&
                !Is.WordSeparator(this.currentChar)) {
                if (this.currentChar === '[') {
                    out.value += this.readBrackets();
                    out.hasSubExpr = true;
                    out.hasVariable = true;
                    continue;
                }
                if (this.currentChar === '$') {
                    out.value += this.readVariable();
                    out.hasSubExpr = true;
                    out.hasVariable = true;
                    continue;
                }
                if (this.currentChar === '\\')
                    out.value += this.read();
                out.value += this.read();
            }
            this.wordIdx += 1;
            return out;
        };
        Lexer.prototype.readBrackets = function () {
            var output = '';
            var depth = 0;
            while (this.pos < this.input.length) {
                if (this.currentChar === ']')
                    depth--;
                if (this.currentChar === '[')
                    depth++;
                if (this.currentChar === '\\')
                    output += this.read();
                output += this.read();
                if (depth === 0)
                    break;
            }
            return output;
        };
        Lexer.prototype.readVariable = function () {
            var output = '';
            output += this.read();
            if (this.currentChar === '{') {
                this.currentChar = this.currentChar;
                while (this.pos < this.input.length && this.currentChar !== '}') {
                    if (this.currentChar === '\\')
                        output += this.read();
                    output += this.read();
                }
                return output;
            }
            while (this.pos < this.input.length) {
                if (this.currentChar === '(') {
                    this.currentChar = this.currentChar;
                    while (this.pos < this.input.length) {
                        if (this.currentChar === ')') {
                            output += this.read();
                            break;
                        }
                        if (this.currentChar === '$') {
                            output += this.readVariable();
                        }
                        else {
                            if (this.currentChar === '\\')
                                output += this.read();
                            output += this.read();
                        }
                    }
                    if (this.pos >= this.input.length)
                        throw new tclerror_1.TclError('missing )');
                    return output;
                }
                if (Is.WordSeparator(this.currentChar) ||
                    Is.Brace(this.currentChar) ||
                    this.currentChar === '$' ||
                    this.currentChar === '\\') {
                    break;
                }
                output += this.read();
            }
            return output;
        };
        Lexer.prototype.newWordToken = function () {
            return {
                value: '',
                hasVariable: false,
                hasSubExpr: false,
                stopBackslash: false,
                index: this.wordIdx,
                source: '',
                sourceLocation: 0,
            };
        };
        return Lexer;
    }());
    exports.Lexer = Lexer;
});
//# sourceMappingURL=lexer.js.map