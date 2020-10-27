var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "nearley", "../lexers/word", "../../parser/WordToken"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Nearley = require("nearley");
    function id(d) { return d[0]; }
    var word_1 = require("../lexers/word");
    var WordToken_1 = require("../../parser/WordToken");
    ;
    ;
    ;
    ;
    var grammar = {
        Lexer: word_1.wordLexer,
        ParserRules: [
            { "name": "word$ebnf$1", "symbols": ["nontextparts"], "postprocess": id },
            { "name": "word$ebnf$1", "symbols": [], "postprocess": function () { return null; } },
            { "name": "word", "symbols": ["textpart", "word$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 2), part = _b[0], parts = _b[1];
                    return parts ? __spread([part], parts) : [part];
                } },
            { "name": "word", "symbols": ["nontextparts"], "postprocess": id },
            { "name": "nontextparts$ebnf$1", "symbols": ["word"], "postprocess": id },
            { "name": "nontextparts$ebnf$1", "symbols": [], "postprocess": function () { return null; } },
            { "name": "nontextparts", "symbols": ["nontextpart", "nontextparts$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 2), part = _b[0], word = _b[1];
                    return word ? __spread([part], word) : [part];
                } },
            { "name": "nontextpart", "symbols": ["escapepart"], "postprocess": id },
            { "name": "nontextpart", "symbols": ["variablepart"], "postprocess": id },
            { "name": "nontextpart", "symbols": ["codepart"], "postprocess": id },
            { "name": "textpart$ebnf$1", "symbols": [(word_1.wordLexer.has("char") ? { type: "char" } : char)] },
            { "name": "textpart$ebnf$1", "symbols": ["textpart$ebnf$1", (word_1.wordLexer.has("char") ? { type: "char" } : char)], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "textpart", "symbols": ["textpart$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 1), chars = _b[0];
                    return new WordToken_1.TextPart(chars.join(''));
                } },
            { "name": "escapepart", "symbols": [(word_1.wordLexer.has("escape") ? { type: "escape" } : escape)], "postprocess": function (_a) {
                    var _b = __read(_a, 1), escape = _b[0];
                    return new WordToken_1.EscapePart(escape.toString());
                } },
            { "name": "variablepart$ebnf$1", "symbols": [] },
            { "name": "variablepart$ebnf$1", "symbols": ["variablepart$ebnf$1", (word_1.wordLexer.has("variablechar") ? { type: "variablechar" } : variablechar)], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "variablepart$ebnf$2", "symbols": ["variableindex"], "postprocess": id },
            { "name": "variablepart$ebnf$2", "symbols": [], "postprocess": function () { return null; } },
            { "name": "variablepart", "symbols": [(word_1.wordLexer.has("dollar") ? { type: "dollar" } : dollar), "variablepart$ebnf$1", "variablepart$ebnf$2"], "postprocess": function (_a) {
                    var _b = __read(_a, 3), name = _b[1], index = _b[2];
                    return new WordToken_1.VariablePart(name.join(''), index);
                } },
            { "name": "variableindex", "symbols": [(word_1.wordLexer.has("lparen") ? { type: "lparen" } : lparen), "word", (word_1.wordLexer.has("rparen") ? { type: "rparen" } : rparen)], "postprocess": function (_a) {
                    var _b = __read(_a, 2), word = _b[1];
                    return word;
                } },
            { "name": "codepart$ebnf$1", "symbols": [] },
            { "name": "codepart$ebnf$1", "symbols": ["codepart$ebnf$1", (word_1.wordLexer.has("bracketchar") ? { type: "bracketchar" } : bracketchar)], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "codepart", "symbols": [(word_1.wordLexer.has("lbracket") ? { type: "lbracket" } : lbracket), "codepart$ebnf$1", (word_1.wordLexer.has("rbracket") ? { type: "rbracket" } : rbracket)], "postprocess": function (_a) {
                    var _b = __read(_a, 2), chars = _b[1];
                    return new WordToken_1.CodePart(chars.join(''));
                } }
        ],
        ParserStart: "word",
    };
    var CompiledParser = new Nearley.Parser(grammar).grammar;
    var parse = function (input) { return (new Nearley.Parser(CompiledParser)).feed(input).results[0]; };
    exports.default = parse;
});
//# sourceMappingURL=word.js.map