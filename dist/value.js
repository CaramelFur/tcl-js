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
    var Value = (function () {
        function Value(name, value) {
            this.name = name;
            this.value = value;
        }
        return Value;
    }());
    exports.Value = Value;
});
//# sourceMappingURL=value.js.map