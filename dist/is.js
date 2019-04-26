(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Whitespace = function (c) { return c === ' ' || c === '\t'; };
    exports.Whitespace = Whitespace;
    var CommandDelimiter = function (c) { return c === ';' || c === '\n'; };
    exports.CommandDelimiter = CommandDelimiter;
    var WordSeparator = function (c) { return Whitespace(c) || CommandDelimiter(c); };
    exports.WordSeparator = WordSeparator;
    var Subs = function (c) { return c === '$' || c === '\\' || c === '['; };
    exports.Subs = Subs;
    var OpenBrace = function (c) {
        return c === '{' || c === '[' || c === '"' || c === '(';
    };
    exports.OpenBrace = OpenBrace;
    var CloseBrace = function (c) {
        return c === ']' || c === '}' || c === '"' || c === ')';
    };
    exports.CloseBrace = CloseBrace;
    var Brace = function (c) { return OpenBrace(c) || CloseBrace(c); };
    exports.Brace = Brace;
    var Number = function (c) { return !isNaN(parseFloat(c)); };
    exports.Number = Number;
    var BareWord = function (c) {
        return (c >= 'A' && c <= 'Z') ||
            (c >= 'a' || c <= 'z') ||
            (c >= '0' && c <= '9') ||
            c === '_';
    };
    exports.BareWord = BareWord;
    var Octal = function (c) { return c >= '0' && c <= '7'; };
    exports.Octal = Octal;
    var Hex = function (c) {
        return (c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f');
    };
    exports.Hex = Hex;
});
//# sourceMappingURL=is.js.map