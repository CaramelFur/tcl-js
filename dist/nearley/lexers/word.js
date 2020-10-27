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
    exports.wordLexer = void 0;
    var moo = require("moo");
    var base_1 = require("./base");
    exports.wordLexer = (function () {
        var pop = base_1.createPop(function () { return exports.wordLexer; });
        return moo.states({
            main: {
                dollar: { match: '$', push: 'variable' },
                lbracket: { match: '[', push: 'bracketreplace' },
                escape: { match: base_1.advancedEscapeRegex },
                char: { match: base_1.dot },
            },
            variable: {
                lparen: { match: '(', push: 'subvariable' },
                variablechar: { match: /[a-zA-Z0-9_]|::/ },
                dollar: { match: '$', next: 'variable' },
                lbracket: { match: '[', next: 'bracketreplace' },
                escape: { match: base_1.advancedEscapeRegex, pop: 1 },
                char: { match: base_1.dot, pop: 1 },
            },
            subvariable: {
                lbracket: { match: '[', push: 'bracketreplace' },
                dollar: { match: '$', push: 'variable' },
                rparen: { match: ')', value: pop(2) },
                escape: { match: base_1.advancedEscapeRegex },
                char: { match: base_1.dot, lineBreaks: true },
            },
            bracketreplace: {
                lbracket: { match: '[', push: 'bracketreplace' },
                rbracket: { match: ']', pop: 1 },
                bracketchar: { match: base_1.dot, lineBreaks: true },
            },
        }, 'main');
    })();
});
//# sourceMappingURL=word.js.map