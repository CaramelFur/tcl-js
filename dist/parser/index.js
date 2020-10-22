(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./TclToken", "./generated/parser"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parse = void 0;
    var TclToken_1 = require("./TclToken");
    var Parser = require("./generated/parser");
    function parse(tcl, options) {
        if (options === void 0) { options = { keepComments: false }; }
        var endlineEscapedTclString = tcl.replace(/\\\n[ \t]*/g, ' ');
        var parsed = Parser.parse(endlineEscapedTclString);
        if (!options.keepComments) {
            for (var i = 0; i < parsed.commands.length; i++) {
                if (parsed.commands[i] instanceof TclToken_1.TclComment) {
                    parsed.commands.splice(i, 1);
                }
            }
        }
        return parsed;
    }
    exports.parse = parse;
});
//# sourceMappingURL=index.js.map