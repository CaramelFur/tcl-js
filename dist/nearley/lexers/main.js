(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "moo"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lexer = void 0;
    var moo = require("moo");
    exports.lexer = (function () {
        var wsregex = /[ \t\v\f\r]/;
        var escapeRegex = /\\.|[^\\]|\\/;
        var pop = function (amount) { return function (value) {
            for (var i = 0; i < amount; i++)
                exports.lexer.popState();
            return value;
        }; };
        var push = function () {
            var pushes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                pushes[_i] = arguments[_i];
            }
            return function (value) {
                for (var i = 0; i < pushes.length; i++)
                    exports.lexer.pushState(pushes[i]);
                return value;
            };
        };
        return moo.states({
            main: {
                nl: { match: '\n', lineBreaks: true },
                ws: wsregex,
                semiColon: ';',
                hashTag: { match: '#', push: 'comment' },
                expandSign: { match: '{*}' },
                lbrace: { match: '{', push: 'braceWord' },
                quote: { match: '"', push: 'quoteWord' },
                wordchar: [
                    { match: '$', value: push('word', 'variable') },
                    { match: '[', value: push('word', 'bracketreplace') },
                    { match: escapeRegex, lineBreaks: true, push: 'word' },
                ],
            },
            comment: {
                comment: /[^\n]+/,
                nl: { match: '\n', lineBreaks: true, pop: 1 },
            },
            word: {
                nl: { match: '\n', lineBreaks: true, pop: 1 },
                ws: { match: wsregex, pop: 1 },
                semiColon: { match: ';', pop: 1 },
                wordchar: [
                    { match: '$', push: 'variable' },
                    { match: '[', push: 'bracketreplace' },
                    { match: escapeRegex, lineBreaks: true },
                ],
            },
            quoteWord: {
                wordchar: [
                    { match: '"', pop: 1 },
                    { match: '$', push: 'variable' },
                    { match: '[', push: 'bracketreplace' },
                    { match: escapeRegex, lineBreaks: true },
                ],
            },
            variable: {
                nl: { match: '\n', lineBreaks: true, value: pop(2) },
                ws: { match: wsregex, value: pop(2) },
                semiColon: { match: ';', value: pop(2) },
                wordchar: [
                    { match: '(', push: 'subvariable' },
                    { match: /[a-zA-Z0-9_]|::/ },
                    { match: escapeRegex, lineBreaks: true, pop: 1 },
                ],
            },
            subvariable: {
                wordchar: [
                    { match: '[', push: 'bracketreplace' },
                    { match: '$', push: 'variable' },
                    { match: ')', pop: 1 },
                    { match: escapeRegex, lineBreaks: true },
                ],
            },
            bracketreplace: {
                wordchar: [
                    { match: '[', push: 'bracketreplace' },
                    { match: ']', pop: 1 },
                    { match: escapeRegex, lineBreaks: true },
                ],
            },
            braceWord: {
                wordchar: [
                    { match: '{', push: 'braceWord' },
                    { match: '}', pop: 1 },
                    { match: escapeRegex, lineBreaks: true },
                ],
            },
        }, 'main');
    })();
});
//# sourceMappingURL=main.js.map