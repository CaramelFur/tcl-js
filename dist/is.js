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
    var Boolean = function (c) {
        c = c.toLowerCase();
        return (c === 'true' ||
            c === 'false' ||
            c === 'on' ||
            c === 'off' ||
            c === 'yes' ||
            c === 'no' ||
            c === '1' ||
            c === '0');
    };
    exports.Boolean = Boolean;
});
//# sourceMappingURL=is.js.map