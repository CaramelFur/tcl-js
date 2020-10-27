(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../TclError", "./variables/TclArrayVariable"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compileVarName = exports.TclScope = void 0;
    var TclError_1 = require("../TclError");
    var TclArrayVariable_1 = require("./variables/TclArrayVariable");
    var TclScope = (function () {
        function TclScope(disableCommands, parent) {
            this.parent = null;
            this.variables = {};
            if (parent)
                this.parent = parent;
        }
        TclScope.prototype.getParent = function (levels) {
            if (levels === void 0) { levels = 1; }
            if (this.parent === null)
                return null;
            if (levels === 1)
                return this.parent;
            return this.parent.getParent(levels - 1);
        };
        TclScope.prototype.hasVariable = function (name) {
            return Object.keys(this.variables).indexOf(name) >= 0;
        };
        TclScope.prototype.setVariable = function (name, index, variable) {
            if (index === null) {
                if (this.hasVariable(name) && this.variables[name].isArray())
                    throw new Error("can't set \"" + compileVarName(name, index) + "\": variable is array");
                this.variables[name] = variable;
            }
            else {
                if (this.hasVariable(name)) {
                    if (!this.variables[name].isArray())
                        throw new Error("can't set \"" + compileVarName(name, index) + "\": variable isn't array");
                }
                else {
                    this.variables[name] = new TclArrayVariable_1.TclArrayVariable();
                }
                this.variables[name].setEntry(index, variable);
            }
        };
        TclScope.prototype.getVariable = function (name, index) {
            if (index === void 0) { index = null; }
            if (!this.hasVariable(name))
                throw new TclError_1.TclError("can't read \"" + compileVarName(name, index) + "\": no such variable");
            var variable = this.variables[name];
            if (index !== null) {
                if (!variable.isArray())
                    throw new TclError_1.TclError("can't read \"" + compileVarName(name, index) + "\": variable isn't array");
                return variable.getEntry(index);
            }
            else {
                if (variable.isArray())
                    throw new TclError_1.TclError("can't read \"" + compileVarName(name, index) + "\": variable is array");
                return variable;
            }
        };
        TclScope.prototype.unsetVariable = function (name, index) {
            if (index === void 0) { index = null; }
            if (!this.hasVariable(name))
                throw new TclError_1.TclError("can't unset \"" + compileVarName(name, index) + "\": no such variable");
            if (index !== null) {
                if (!this.variables[name].isArray())
                    throw new TclError_1.TclError("can't unset \"" + compileVarName(name, index) + "\": variable isn't array");
                if (!this.variables[name].hasEntry(index))
                    throw new TclError_1.TclError("can't unset \"" + compileVarName(name, index) + "\": no such element in array");
                this.variables[name].unsetEntry(index);
            }
            else {
                delete this.variables[name];
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