(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TclInterpreter = void 0;
    var TclInterpreter = (function () {
        function TclInterpreter(options) {
            this.options = options;
        }
        return TclInterpreter;
    }());
    exports.TclInterpreter = TclInterpreter;
});
//# sourceMappingURL=TclInterpreter.js.map