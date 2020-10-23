(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./TclToken", "../pegjs/parsers/script", "../pegjs/parsers/word"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ParseWord = exports.ParseTcl = void 0;
    var TclToken_1 = require("./TclToken");
    var TclParser = require("../pegjs/parsers/script");
    var WordParser = require("../pegjs/parsers/word");
    function ParseTcl(tcl, options) {
        if (options === void 0) { options = { keepComments: false }; }
        var endlineEscapedTclString = tcl.replace(/([^\\](\\\\)*)\\\n/g, '$1 ');
        var parsed = TclParser.parse(endlineEscapedTclString);
        if (!options.keepComments) {
            for (var i = 0; i < parsed.commands.length; i++) {
                if (parsed.commands[i] instanceof TclToken_1.TclComment) {
                    parsed.commands.splice(i, 1);
                }
            }
        }
        return parsed;
    }
    exports.ParseTcl = ParseTcl;
    function ParseWord(word) {
        return WordParser.parse(word);
    }
    exports.ParseWord = ParseWord;
});
//# sourceMappingURL=index.js.map