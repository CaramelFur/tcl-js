(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../TclError"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createHelpers = void 0;
    var TclError_1 = require("../TclError");
    var thrw = function (message) { return function () {
        throw new TclError_1.TclError(message);
    }; };
    function createHelpers(options) {
        return {
            wrongNumArgs: thrw("wrong # args: should be \"" + options.command + " " + options.argsBase + "\"")
        };
    }
    exports.createHelpers = createHelpers;
});
//# sourceMappingURL=TclCommandHelpers.js.map