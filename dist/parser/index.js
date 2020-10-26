(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./TclToken", "../nearley/parsers/script"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ParseTcl = void 0;
    var TclToken_1 = require("./TclToken");
    var script_1 = require("../nearley/parsers/script");
    function ParseTcl(tcl, options) {
        if (options === void 0) { options = { keepComments: false, keepNops: false }; }
        var endlineEscapedTclString = tcl.replace(/([^\\](\\\\)*)\\\n/g, '$1 ');
        var parsed = script_1.default(endlineEscapedTclString);
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
});
//# sourceMappingURL=index.js.map