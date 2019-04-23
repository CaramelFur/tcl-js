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
            this.input = input;
            this.currentChar = this.input.charAt(0);
        }
        Lexer.prototype.read = function () {
            var old = this.currentChar;
            this.pos += 1;
            this.currentChar = this.input.charAt(this.pos);
            this.currentSentence += old;
            return old;
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
        Lexer.prototype.nextBracketWord = function (keepOuterBracket, openingBracket, closingBracket) {
            var delimiters = [];
            var out = {
                value: '',
                hasVariable: false,
                hasSubExpr: false,
                stopBackslash: false,
                index: this.wordIdx,
                lastSentence: '',
            };
            function testOpenDelimiters(test) {
                if (test === openingBracket) {
                    delimiters.push(closingBracket);
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
                var opening = testOpenDelimiters(this.currentChar);
                if (opening === 1 && !keepOuterBracket) {
                    this.read();
                    continue;
                }
                var closing = testCloseDelimiters(this.currentChar);
                if (closing === 0 && !keepOuterBracket) {
                    this.read();
                    continue;
                }
                if (testEndOfWord(this.currentChar))
                    break;
                if (delimiters.length === 0 && closing === -1)
                    throw new tclerror_1.TclError('extra characters after close-brace:');
                if (this.currentChar === '\\')
                    out.value += this.read();
                out.value += this.read();
            }
            if (delimiters.length > 0)
                throw new tclerror_1.TclError('missing close-brace');
            this.wordIdx += 1;
            return out;
        };
        Lexer.prototype.nextQuoteWord = function () {
            if (this.currentChar !== '"')
                throw new tclerror_1.TclError('nextQuoteWord was called without a quote exisiting');
            this.read();
            var out = {
                value: '',
                hasVariable: false,
                hasSubExpr: false,
                stopBackslash: false,
                index: this.wordIdx,
                lastSentence: '',
            };
            while (this.pos < this.input.length && this.currentChar !== '"') {
                if (this.currentChar === '[')
                    out.hasSubExpr = true;
                if (this.currentChar === '$')
                    out.hasVariable = true;
                if (this.currentChar === '\\')
                    out.value += this.read();
                out.value += this.read();
            }
            var close = this.read();
            if (close !== '"')
                throw new tclerror_1.TclError('missing "');
            if (!Is.WordSeparator(this.currentChar))
                throw new tclerror_1.TclError('extra characters after close-quote');
            this.wordIdx += 1;
            return out;
        };
        Lexer.prototype.nextSimpleWord = function () {
            var out = {
                value: '',
                hasVariable: false,
                hasSubExpr: false,
                stopBackslash: false,
                index: this.wordIdx,
                lastSentence: '',
            };
            while (this.pos < this.input.length &&
                !Is.WordSeparator(this.currentChar)) {
                if (this.currentChar === '[')
                    out.hasSubExpr = true;
                if (this.currentChar === '$')
                    out.hasVariable = true;
                if (this.currentChar === '\\')
                    out.value += this.read();
                out.value += this.read();
            }
            this.wordIdx += 1;
            return out;
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
                    var word = this.nextBracketWord(false, '{', '}');
                    word.stopBackslash = true;
                    return word;
                }
                case this.currentChar === '[': {
                    var word = this.nextBracketWord(true, '[', ']');
                    word.hasSubExpr = true;
                    return word;
                }
                case this.currentChar === '"':
                    return this.nextQuoteWord();
                default:
                    return this.nextSimpleWord();
            }
        };
        Lexer.prototype.nextToken = function () {
            var token = this.getNextToken();
            if (token)
                token.lastSentence = this.currentSentence;
            return token;
        };
        return Lexer;
    }());
    exports.Lexer = Lexer;
});
//# sourceMappingURL=lexer.js.map