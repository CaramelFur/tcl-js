(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./TclToken", "../nearley/parsers/script", "../nearley/parsers/word", "../nearley/parsers/list"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ParseList = exports.ParseWord = exports.ParseTcl = void 0;
    var TclToken_1 = require("./TclToken");
    var script_1 = require("../nearley/parsers/script");
    var word_1 = require("../nearley/parsers/word");
    var list_1 = require("../nearley/parsers/list");
    var endlineEscapeRegex = /([^\\](\\\\)*)\\\n/g;
    function ParseTcl(tcl, options) {
        if (options === void 0) { options = { keepComments: false, keepNops: false }; }
        var parsed = script_1.default(tcl);
        if (!options.keepComments || !options.keepNops)
            for (var i = 0; i < parsed.commands.length; i++) {
                if (!options.keepComments && parsed.commands[i] instanceof TclToken_1.TclComment) {
                    parsed.commands.splice(i, 1);
                    continue;
                }
                if (!options.keepNops &&
                    parsed.commands[i] instanceof TclToken_1.TclCommand &&
                    parsed.commands[i].words.length === 0) {
                    parsed.commands.splice(i, 1);
                    continue;
                }
            }
        return parsed;
    }
    exports.ParseTcl = ParseTcl;
    function ParseWord(word) {
        return word_1.default(word);
    }
    exports.ParseWord = ParseWord;
    function ParseList(list) {
        return list_1.default(list).map(function (entry) { return entry.value; });
    }
    exports.ParseList = ParseList;
});
//# sourceMappingURL=index.js.map