(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./value"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var value_1 = require("./value");
    var Scope = (function () {
        function Scope(parent) {
            this.parent = null;
            this.members = {};
            parent = parent;
        }
        Scope.prototype.pop = function () {
            return this.parent;
        };
        Scope.prototype.define = function (name, value) {
            this.members[name] = new value_1.Value(name, value);
            return this;
        };
        Scope.prototype.resolve = function (name) {
            if (Object.prototype.hasOwnProperty.call(this.members, name)) {
                return this.members[name];
            }
            else if (this.parent !== null) {
                return this.parent.resolve(name);
            }
            throw new Error("Can't read \"" + name + "\": no such variable");
        };
        return Scope;
    }());
    exports.Scope = Scope;
});
//# sourceMappingURL=scope.js.map