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
        define(["require", "exports", "../TclError", "./Commands", "./TclCommandHelpers", "./variables/TclArrayVariable"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compileVarName = exports.TclScope = exports.TclCommandScope = void 0;
    var TclError_1 = require("../TclError");
    var Commands_1 = require("./Commands");
    var TclCommandHelpers_1 = require("./TclCommandHelpers");
    var TclArrayVariable_1 = require("./variables/TclArrayVariable");
    var TclCommandScope = (function () {
        function TclCommandScope(disableCommands) {
            var e_1, _a;
            this.procs = {};
            Commands_1.LoadCommands(this);
            try {
                for (var disableCommands_1 = __values(disableCommands), disableCommands_1_1 = disableCommands_1.next(); !disableCommands_1_1.done; disableCommands_1_1 = disableCommands_1.next()) {
                    var disabledCommand = disableCommands_1_1.value;
                    if (this.hasProc(disabledCommand)) {
                        this.deleteProc(disabledCommand);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (disableCommands_1_1 && !disableCommands_1_1.done && (_a = disableCommands_1.return)) _a.call(disableCommands_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        TclCommandScope.prototype.hasProc = function (command) {
            return Object.keys(this.procs).indexOf(command) >= 0;
        };
        TclCommandScope.prototype.getProc = function (command) {
            if (!this.hasProc(command)) {
                throw new TclError_1.TclError("invalid command name \"" + command + "\"");
            }
            return this.procs[command];
        };
        TclCommandScope.prototype.addProc = function (options, fullHandler) {
            if (this.hasProc(options.command))
                return false;
            var helpers = TclCommandHelpers_1.createHelpers(options);
            var handler = function (interpreter, scope, args) { return fullHandler(interpreter, scope, args, helpers); };
            this.procs[options.command] = {
                handler: handler,
                options: options,
            };
            return true;
        };
        TclCommandScope.prototype.deleteProc = function (command) {
            delete this.procs[command];
        };
        return TclCommandScope;
    }());
    exports.TclCommandScope = TclCommandScope;
    var TclScope = (function () {
        function TclScope(disableCommands, parent) {
            this.parent = null;
            this.variables = {};
            if (parent) {
                this.parent = parent;
                this.commandScope = parent.getCommandScope();
            }
            else {
                this.commandScope = new TclCommandScope(disableCommands || []);
            }
        }
        TclScope.prototype.getCommandScope = function () {
            return this.commandScope;
        };
        TclScope.prototype.getParent = function (levels, fail) {
            if (levels === void 0) { levels = 1; }
            if (fail === void 0) { fail = true; }
            if (this.parent === null)
                return fail ? null : this;
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