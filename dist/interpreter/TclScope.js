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
    exports.compileVarName = exports.TclScope = void 0;
    var TclError_1 = require("../TclError");
    var TclScope = (function () {
        function TclScope(disableCommands) {
            this.variables = {};
        }
        TclScope.prototype.hasVariable = function (name) {
            return Object.keys(this.variables).indexOf(name) >= 0;
        };
        TclScope.prototype.getVariable = function (name, index) {
            if (index === void 0) { index = null; }
            if (!this.hasVariable(name))
                throw new TclError_1.TclError("can't read \"" + compileVarName(name, index) + "\": no such variable");
            var variable = this.variables[name];
            if (index !== null) {
                if (!variable.isArray())
                    throw new TclError_1.TclError("can't read \"" + compileVarName(name, index) + "\": variable isn't array");
                return variable;
            }
            else {
                if (variable.isArray())
                    throw new TclError_1.TclError("can't read \"" + compileVarName(name, index) + "\": variable is array");
                return variable;
            }
        };
        return TclScope;
    }());
    exports.TclScope = TclScope;
    function compileVarName(name, index) {
        return "" + name + (index !== null ? "(" + index + ")" : '');
    }
    exports.compileVarName = compileVarName;
});
//# sourceMappingURL=TclScope.js.map