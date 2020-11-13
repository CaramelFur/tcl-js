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
    exports.listlexer = void 0;
    var moo = require("moo");
    var base_1 = require("./base");
    exports.listlexer = (function () {
        var pop = base_1.createPop(function () { return exports.listlexer; });
        var push = base_1.createPush(function () { return exports.listlexer; });
        return moo.states({
            main: {
                ws: { match: base_1.nlwsregex, lineBreaks: true },
                lbrace: { match: '{', push: 'braceWord' },
                quote: { match: '"', push: 'quoteWord' },
                wordchar: [
                    { match: '$', value: push('word', 'variable') },
                    { match: '[', value: push('word', 'bracketreplace') },
                    { match: base_1.escapeRegex, push: 'word', lineBreaks: true },
                ],
            },
            word: {
                ws: { match: base_1.nlwsregex, pop: 1, lineBreaks: true },
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
                        match: /\\.|[^\\]|\\(?=[ \t\v\f\r\n])/,
                        value: pop(2),
                        lineBreaks: true,
                    },
                    { match: base_1.escapeRegex, pop: 1, lineBreaks: true },
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
//# sourceMappingURL=list.js.map