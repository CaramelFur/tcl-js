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
    exports.TclVariable = void 0;
    var TclVariable = (function () {
        function TclVariable(value) {
            this.value = value || '';
        }
        TclVariable.prototype.toString = function () {
            return this.value;
        };
        TclVariable.prototype.toStringList = function () {
            return [];
        };
        TclVariable.prototype.toVarList = function () {
            return [];
        };
        return TclVariable;
    }());
    exports.TclVariable = TclVariable;
});
//# sourceMappingURL=TclVariable.js.map