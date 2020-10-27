var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./commands/set"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoadCommands = void 0;
    var set_1 = require("./commands/set");
    var BuiltInCommands = [set_1.default];
    function LoadCommands(scope) {
        var e_1, _a;
        try {
            for (var BuiltInCommands_1 = __values(BuiltInCommands), BuiltInCommands_1_1 = BuiltInCommands_1.next(); !BuiltInCommands_1_1.done; BuiltInCommands_1_1 = BuiltInCommands_1.next()) {
                var builtInCommand = BuiltInCommands_1_1.value;
                builtInCommand(scope);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (BuiltInCommands_1_1 && !BuiltInCommands_1_1.done && (_a = BuiltInCommands_1.return)) _a.call(BuiltInCommands_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    exports.LoadCommands = LoadCommands;
});
//# sourceMappingURL=Commands.js.map