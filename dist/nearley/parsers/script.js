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
        define(["require", "exports", "nearley", "../lexers/main", "../../parser/TclToken", "../../parser/TclToken"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Nearley = require("nearley");
    function id(d) { return d[0]; }
    var main_1 = require("../lexers/main");
    var TclToken_1 = require("../../parser/TclToken");
    var TclToken_2 = require("../../parser/TclToken");
    ;
    ;
    ;
    ;
    var grammar = {
        Lexer: main_1.lexer,
        ParserRules: [
            { "name": "script", "symbols": ["statementList"], "postprocess": function (_a) {
                    var _b = __read(_a, 1), list = _b[0];
                    return new TclToken_1.TclScript(list);
                } },
            { "name": "statementList", "symbols": ["comments"], "postprocess": id },
            { "name": "statementList", "symbols": ["commands"], "postprocess": id },
            { "name": "comments", "symbols": ["comment", (main_1.lexer.has("nl") ? { type: "nl" } : nl), "_", "statementList"], "postprocess": function (_a) {
                    var _b = __read(_a, 4), comment = _b[0], list = _b[3];
                    return __spread([comment], list);
                }
            },
            { "name": "comments", "symbols": ["comment"] },
            { "name": "commands", "symbols": ["command", "_", "commandSeperator", "_", "statementList"], "postprocess": function (_a) {
                    var _b = __read(_a, 5), command = _b[0], ws1 = _b[1], sp = _b[2], ws2 = _b[3], list = _b[4];
                    if (list[0].line === 0 && list[0].col === 0) {
                        list[0].line = (ws2 || sp).line;
                        list[0].col = (ws2 || sp).col;
                    }
                    return __spread([command], list);
                }
            },
            { "name": "commands", "symbols": ["command"] },
            { "name": "comment$ebnf$1", "symbols": [(main_1.lexer.has("comment") ? { type: "comment" } : comment)], "postprocess": id },
            { "name": "comment$ebnf$1", "symbols": [], "postprocess": function () { return null; } },
            { "name": "comment", "symbols": [(main_1.lexer.has("hashTag") ? { type: "hashTag" } : hashTag), "comment$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 2), hashtag = _b[0], comment = _b[1];
                    return new TclToken_1.TclComment(comment || "", hashtag.line, hashtag.col);
                } },
            { "name": "command", "symbols": ["list"], "postprocess": function (_a) {
                    var _b = __read(_a === void 0 ? [] : _a, 1), words = _b[0];
                    return words.length === 0 ? new TclToken_1.TclCommand(words, 0, 0) : new TclToken_1.TclCommand(words, words[0].line, words[0].col);
                } },
            { "name": "commandSeperator$ebnf$1$subexpression$1", "symbols": [(main_1.lexer.has("nl") ? { type: "nl" } : nl)] },
            { "name": "commandSeperator$ebnf$1$subexpression$1", "symbols": [(main_1.lexer.has("semiColon") ? { type: "semiColon" } : semiColon)] },
            { "name": "commandSeperator$ebnf$1", "symbols": ["commandSeperator$ebnf$1$subexpression$1"] },
            { "name": "commandSeperator$ebnf$1$subexpression$2", "symbols": [(main_1.lexer.has("nl") ? { type: "nl" } : nl)] },
            { "name": "commandSeperator$ebnf$1$subexpression$2", "symbols": [(main_1.lexer.has("semiColon") ? { type: "semiColon" } : semiColon)] },
            { "name": "commandSeperator$ebnf$1", "symbols": ["commandSeperator$ebnf$1", "commandSeperator$ebnf$1$subexpression$2"], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "commandSeperator", "symbols": ["commandSeperator$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 1), seperator = _b[0];
                    return ({ value: seperator.join(''), line: seperator[0].line, col: seperator[0].col });
                } },
            { "name": "_$ebnf$1", "symbols": [] },
            { "name": "_$ebnf$1$subexpression$1", "symbols": [(main_1.lexer.has("ws") ? { type: "ws" } : ws)] },
            { "name": "_$ebnf$1", "symbols": ["_$ebnf$1", "_$ebnf$1$subexpression$1"], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "_", "symbols": ["_$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 1), ws = _b[0];
                    return ws.length !== 0 ? ({ value: ws.join(''), line: ws[0].line, col: ws[0].col }) : null;
                } },
            { "name": "__$ebnf$1$subexpression$1", "symbols": [(main_1.lexer.has("ws") ? { type: "ws" } : ws)] },
            { "name": "__$ebnf$1", "symbols": ["__$ebnf$1$subexpression$1"] },
            { "name": "__$ebnf$1$subexpression$2", "symbols": [(main_1.lexer.has("ws") ? { type: "ws" } : ws)] },
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
            { "name": "word$ebnf$1", "symbols": [(main_1.lexer.has("expandSign") ? { type: "expandSign" } : expandSign)], "postprocess": id },
            { "name": "word$ebnf$1", "symbols": [], "postprocess": function () { return null; } },
            { "name": "word", "symbols": ["word$ebnf$1", "nonExpansionWord"], "postprocess": function (_a) {
                    var _b = __read(_a, 2), expand = _b[0], word = _b[1];
                    return expand ? word.setExpand(expand, expand.line, expand.col) : word;
                } },
            { "name": "nonExpansionWord", "symbols": ["simpleWord"], "postprocess": id },
            { "name": "nonExpansionWord", "symbols": ["quotedWord"], "postprocess": id },
            { "name": "nonExpansionWord", "symbols": ["bracedWord"], "postprocess": id },
            { "name": "simpleWord$ebnf$1", "symbols": [(main_1.lexer.has("wordchar") ? { type: "wordchar" } : wordchar)] },
            { "name": "simpleWord$ebnf$1", "symbols": ["simpleWord$ebnf$1", (main_1.lexer.has("wordchar") ? { type: "wordchar" } : wordchar)], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "simpleWord", "symbols": ["simpleWord$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 1), chars = _b[0];
                    return new TclToken_2.TclWord(chars.join(''), chars[0].line, chars[0].col);
                } },
            { "name": "quotedWord$ebnf$1", "symbols": [(main_1.lexer.has("wordchar") ? { type: "wordchar" } : wordchar)] },
            { "name": "quotedWord$ebnf$1", "symbols": ["quotedWord$ebnf$1", (main_1.lexer.has("wordchar") ? { type: "wordchar" } : wordchar)], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "quotedWord", "symbols": [(main_1.lexer.has("quote") ? { type: "quote" } : quote), "quotedWord$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 2), quote = _b[0], chars = _b[1];
                    return new TclToken_2.TclWord(chars.slice(0, -1).join(''), quote.line, quote.col);
                } },
            { "name": "bracedWord$ebnf$1", "symbols": [(main_1.lexer.has("wordchar") ? { type: "wordchar" } : wordchar)] },
            { "name": "bracedWord$ebnf$1", "symbols": ["bracedWord$ebnf$1", (main_1.lexer.has("wordchar") ? { type: "wordchar" } : wordchar)], "postprocess": function (d) { return d[0].concat([d[1]]); } },
            { "name": "bracedWord", "symbols": [(main_1.lexer.has("lbrace") ? { type: "lbrace" } : lbrace), "bracedWord$ebnf$1"], "postprocess": function (_a) {
                    var _b = __read(_a, 2), quote = _b[0], chars = _b[1];
                    return new TclToken_2.TclWord(chars.slice(0, -1).join(''), lbrace.line, lbrace.col, TclToken_2.TclWordTypes.brace);
                } }
        ],
        ParserStart: "script",
    };
    var CompiledParser = new Nearley.Parser(grammar).grammar;
    var parse = function (input) { return (new Nearley.Parser(CompiledParser)).feed(input).results[0]; };
    exports.default = parse;
});
//# sourceMappingURL=script.js.map