(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../types"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var types_1 = require("../types");
    function Load(scope) {
        scope.defineProc('if', function (interpreter, args, command, helpers) {
            return new types_1.TclSimple('');
        }, {
            arguments: {
                pattern: "if name arguments body",
            },
        });
    }
    exports.Load = Load;
});
//# sourceMappingURL=if.js.map