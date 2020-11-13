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
        define(["require", "exports", "nearley", "../lexers/list", "../../parser/TclToken"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Nearley = require("nearley");
    function id(d) { return d[0]; }
    var list_1 = require("../lexers/list");
    var TclToken_1 = require("../../parser/TclToken");
    ;
    ;
    ;
    ;
    var grammar = {
        Lexer: list_1.listlexer,
        ParserRules: [
            { "name": "main", "symbols": ["list"], "postprocess": id },
            { "name": "commandSeperator$ebnf$1$subexpression$1", "symbols": [(list_1.listlexer.has("nl") ? { type: "nl" } : nl)] },
            { "name": "commandSeperator$ebnf$1$subexpression$1", "symbols": [(list_1.listlexer.has("semiColon") ? { type: "semiColon" } : semiColon)] },
            { "name": "commandSeperator$ebnf$1", "symbols": ["commandSeperator$ebnf$1$subexpression$1"] },
            { "name": "commandSeperator$ebnf$1$subexpression$2", "symbols": [(list_1.listlexer.has("nl") ? { type: "nl" } : nl)] },
            { "name": "commandSeperator$ebnf$1$subexpression$2", "symbols": [(list_1.listlexer.has("semiColon") ? { type: "semiColon" } : semiColon)] },
            { "name": "commandSeperator$ebnf$1", "symbols": ["commandSeperator$ebnf$1", "commandSeperator$ebnf$1$subexpression$2"], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "commandSeperator", "symbols": ["commandSeperator$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 1), seperator = _b[0];
                    return ({ value: seperator.join(''), line: seperator[0].line, col: seperator[0].col });
                } },
            { "name": "_$ebnf$1", "symbols": [] },
            { "name": "_$ebnf$1$subexpression$1", "symbols": [(list_1.listlexer.has("ws") ? { type: "ws" } : ws)] },
            { "name": "_$ebnf$1", "symbols": ["_$ebnf$1", "_$ebnf$1$subexpression$1"], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "_", "symbols": ["_$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 1), ws = _b[0];
                    return ws.length !== 0 ? ({ value: ws.join(''), line: ws[0].line, col: ws[0].col }) : null;
                } },
            { "name": "__$ebnf$1$subexpression$1", "symbols": [(list_1.listlexer.has("ws") ? { type: "ws" } : ws)] },
            { "name": "__$ebnf$1", "symbols": ["__$ebnf$1$subexpression$1"] },
            { "name": "__$ebnf$1$subexpression$2", "symbols": [(list_1.listlexer.has("ws") ? { type: "ws" } : ws)] },
            { "name": "__$ebnf$1", "symbols": ["__$ebnf$1", "__$ebnf$1$subexpression$2"], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "__", "symbols": ["__$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 1), ws = _b[0];
                    return ({ value: ws.join(''), line: ws[0].line, col: ws[0].col });
                } },
            { "name": "list", "symbols": ["filledlist"], "postprocess": id },
            { "name": "list", "symbols": [] },
            { "name": "filledlist", "symbols": ["filledlist", "__", "word"], "postprocess": function (_a) {
                    var _b = __read(_a, 3), list = _b[0], word = _b[2];
                    return __spread(list, [word]);
                }
            },
            { "name": "filledlist", "symbols": ["word"] },
            { "name": "word$ebnf$1", "symbols": [(list_1.listlexer.has("expandSign") ? { type: "expandSign" } : expandSign)], "postprocess": id },
            { "name": "word$ebnf$1", "symbols": [], "postprocess": function () { return null; } },
            { "name": "word", "symbols": ["word$ebnf$1", "nonExpansionWord"], "postprocess": function (_a) {
                    var _b = __read(_a, 2), expand = _b[0], word = _b[1];
                    return expand ? word.setExpand(expand, expand.line, expand.col) : word;
                } },
            { "name": "nonExpansionWord", "symbols": ["simpleWord"], "postprocess": id },
            { "name": "nonExpansionWord", "symbols": ["quotedWord"], "postprocess": id },
            { "name": "nonExpansionWord", "symbols": ["bracedWord"], "postprocess": id },
            { "name": "simpleWord$ebnf$1", "symbols": [(list_1.listlexer.has("wordchar") ? { type: "wordchar" } : wordchar)] },
            { "name": "simpleWord$ebnf$1", "symbols": ["simpleWord$ebnf$1", (list_1.listlexer.has("wordchar") ? { type: "wordchar" } : wordchar)], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "simpleWord", "symbols": ["simpleWord$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 1), chars = _b[0];
                    return new TclToken_1.TclWord(chars.join(''), chars[0].line, chars[0].col);
                } },
            { "name": "quotedWord$ebnf$1", "symbols": [(list_1.listlexer.has("wordchar") ? { type: "wordchar" } : wordchar)] },
            { "name": "quotedWord$ebnf$1", "symbols": ["quotedWord$ebnf$1", (list_1.listlexer.has("wordchar") ? { type: "wordchar" } : wordchar)], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "quotedWord", "symbols": [(list_1.listlexer.has("quote") ? { type: "quote" } : quote), "quotedWord$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 2), quote = _b[0], chars = _b[1];
                    return new TclToken_1.TclWord(chars.slice(0, -1).join(''), quote.line, quote.col);
                } },
            { "name": "bracedWord$ebnf$1", "symbols": [(list_1.listlexer.has("wordchar") ? { type: "wordchar" } : wordchar)] },
            { "name": "bracedWord$ebnf$1", "symbols": ["bracedWord$ebnf$1", (list_1.listlexer.has("wordchar") ? { type: "wordchar" } : wordchar)], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "bracedWord", "symbols": [(list_1.listlexer.has("lbrace") ? { type: "lbrace" } : lbrace), "bracedWord$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 2), quote = _b[0], chars = _b[1];
                    return new TclToken_1.TclWord(chars.slice(0, -1).join(''), lbrace.line, lbrace.col, TclToken_1.TclWordTypes.brace);
                } }
        ],
        ParserStart: "main",
    };
    var CompiledParser = new Nearley.Parser(grammar).grammar;
    var parse = function (input) { return (new Nearley.Parser(CompiledParser)).feed(input).results[0]; };
    exports.default = parse;
});
//# sourceMappingURL=list.js.map