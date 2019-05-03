(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./types", "./commands", "./tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var types_1 = require("./types");
    var commands_1 = require("./commands");
    var tclerror_1 = require("./tclerror");
    var Scope = (function () {
        function Scope(parent, disableProcs) {
            if (disableProcs === void 0) { disableProcs = []; }
            this.parent = null;
            this.members = {};
            this.procedures = {};
            if (parent)
                this.parent = parent;
            else {
                for (var _i = 0, LoadFunctions_1 = commands_1.LoadFunctions; _i < LoadFunctions_1.length; _i++) {
                    var loadFunc = LoadFunctions_1[_i];
                    loadFunc(this);
                }
                for (var _a = 0, disableProcs_1 = disableProcs; _a < disableProcs_1.length; _a++) {
                    var disFunc = disableProcs_1[_a];
                    this.disableProc(disFunc);
                }
            }
        }
        Scope.prototype.define = function (name, value) {
            this.members[name] = value;
            return this;
        };
        Scope.prototype.undefine = function (name, nocomplain) {
            if (!Object.prototype.hasOwnProperty.call(this.members, name)) {
                if (this.parent)
                    return this.parent.undefine(name, nocomplain);
                else if (!nocomplain)
                    throw new tclerror_1.TclError("can't unset \"" + name + "\": no such variable");
            }
            var returnValue = this.members[name];
            delete this.members[name];
            return returnValue;
        };
        Scope.prototype.resolve = function (name) {
            if (Object.prototype.hasOwnProperty.call(this.members, name)) {
                return this.members[name];
            }
            else if (this.parent !== null) {
                return this.parent.resolve(name);
            }
            return null;
        };
        Scope.prototype.defineProc = function (name, callback, options) {
            this.procedures[name] = new types_1.TclProc(name, callback, options);
        };
        Scope.prototype.disableProc = function (name) {
            if (Object.prototype.hasOwnProperty.call(this.procedures, name)) {
                delete this.procedures[name];
            }
            else {
                throw new tclerror_1.TclError("can't disable \"" + name + "\": no such function");
            }
        };
        Scope.prototype.resolveProc = function (name) {
            if (Object.prototype.hasOwnProperty.call(this.procedures, name)) {
                return this.procedures[name];
            }
            else if (this.parent !== null) {
                return this.parent.resolveProc(name);
            }
            return null;
        };
        return Scope;
    }());
    exports.Scope = Scope;
});
//# sourceMappingURL=scope.js.map