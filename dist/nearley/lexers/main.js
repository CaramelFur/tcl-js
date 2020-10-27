(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "moo", "./base"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lexer = void 0;
    var moo = require("moo");
    var base_1 = require("./base");
    exports.lexer = (function () {
        var pop = base_1.createPop(function () { return exports.lexer; });
        var push = base_1.createPush(function () { return exports.lexer; });
        return moo.states({
            main: {
                nl: { match: '\n', lineBreaks: true },
                ws: base_1.wsregex,
                semiColon: ';',
                hashTag: { match: '#', push: 'comment' },
                expandSign: { match: '{*}' },
                lbrace: { match: '{', push: 'braceWord' },
                quote: { match: '"', push: 'quoteWord' },
                wordchar: [
                    { match: '$', value: push('word', 'variable') },
                    { match: '[', value: push('word', 'bracketreplace') },
                    { match: base_1.escapeRegex, lineBreaks: true, push: 'word' },
                ],
            },
            comment: {
                comment: /[^\n]+/,
                nl: { match: '\n', lineBreaks: true, pop: 1 },
            },
            word: {
                nl: { match: '\n', lineBreaks: true, pop: 1 },
                ws: { match: base_1.wsregex, pop: 1 },
                semiColon: { match: ';', pop: 1 },
                wordchar: [
                    { match: '$', push: 'variable' },
                    { match: '[', push: 'bracketreplace' },
                    { match: base_1.escapeRegex, lineBreaks: true },
                ],
            },
            quoteWord: {
                wordchar: [
                    { match: '"', pop: 1 },
                    { match: '$', push: 'variable' },
                    { match: '[', push: 'bracketreplace' },
                    { match: base_1.escapeRegex, lineBreaks: true },
                ],
            },
            variable: {
                wordchar: [
                    { match: '(', push: 'subvariable' },
                    { match: /[a-zA-Z0-9_]|::/ },
                    { match: '$', next: 'variable' },
                    { match: '[', next: 'bracketreplace' },
                    {
                        match: /\\.|[^\\]|\\(?=[ \t\v\f\r\n;])/,
                        value: pop(2),
                        lineBreaks: true,
                    },
                    { match: base_1.escapeRegex, lineBreaks: true, pop: 1 },
                ],
            },
            subvariable: {
                wordchar: [
                    { match: '[', push: 'bracketreplace' },
                    { match: '$', push: 'variable' },
                    { match: ')', value: pop(2) },
                    { match: base_1.escapeRegex, lineBreaks: true },
                ],
            },
            bracketreplace: {
                wordchar: [
                    { match: '[', push: 'bracketreplace' },
                    { match: ']', pop: 1 },
                    { match: base_1.escapeRegex, lineBreaks: true },
                ],
            },
            braceWord: {
                wordchar: [
                    { match: '{', push: 'braceWord' },
                    { match: '}', pop: 1 },
                    { match: base_1.escapeRegex, lineBreaks: true },
                ],
            },
        }, 'main');
    })();
});
//# sourceMappingURL=main.js.map