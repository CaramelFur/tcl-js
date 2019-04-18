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
    var variableRegex = /(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/;
    var Scope = (function () {
        function Scope(parent) {
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
            }
        }
        Scope.prototype.pop = function () {
            return this.parent;
        };
        Scope.prototype.define = function (inputName, inputValue) {
            var regex = variableRegex.exec(inputName);
            if (!regex || !regex.groups)
                throw new tclerror_1.TclError("Can't read \"" + inputName + "\": invalid variable name");
            var name = regex.groups.name;
            var input = new types_1.TclSimple(inputValue, name);
            var value = this._resolve(name);
            if (regex.groups.object) {
                var obj = value instanceof types_1.TclObject ? value : undefined;
                if (!obj)
                    obj = new types_1.TclObject(undefined, name);
                obj.set(regex.groups.object, input);
                value = obj;
            }
            else if (regex.groups.array) {
                var arr = value instanceof types_1.TclArray ? value : undefined;
                if (!arr)
                    arr = new types_1.TclArray(undefined, name);
                var arrayNum = parseInt(regex.groups.array, 10);
                arr.set(arrayNum, input);
                value = arr;
            }
            else {
                value = input;
            }
            this.members[name] = value;
            return this;
        };
        Scope.prototype.undefine = function (name, nocomplain) {
            if (!Object.prototype.hasOwnProperty.call(this.members, name) &&
                !nocomplain)
                throw new tclerror_1.TclError("Can't delete \"" + name + "\": no such variable");
            var returnValue = this.members[name];
            delete this.members[name];
            return returnValue;
        };
        Scope.prototype._resolve = function (name) {
            if (Object.prototype.hasOwnProperty.call(this.members, name)) {
                return this.members[name];
            }
            else if (this.parent !== null) {
                return this.parent._resolve(name);
            }
        };
        Scope.prototype.resolve = function (inputName) {
            var regex = variableRegex.exec(inputName);
            if (!regex || !regex.groups)
                throw new tclerror_1.TclError("Can't read \"" + inputName + "\": invalid variable name");
            var name = regex.groups.name;
            var testValue;
            if (Object.prototype.hasOwnProperty.call(this.members, name)) {
                testValue = this.members[name];
            }
            else if (this.parent !== null) {
                testValue = this.parent.resolve(name);
            }
            if (!testValue)
                throw new tclerror_1.TclError("Can't read \"" + name + "\": no such variable");
            var value = testValue;
            if (regex.groups.object) {
                if (!(value instanceof types_1.TclObject))
                    throw new tclerror_1.TclError("Can't read \"" + name + "\": variable is no object");
                return value.getSubValue(regex.groups.object);
            }
            else if (regex.groups.array) {
                if (!(value instanceof types_1.TclArray))
                    throw new tclerror_1.TclError("Can't read \"" + name + "\": variable is no array");
                var arrayNum = parseInt(regex.groups.array, 10);
                return value.getSubValue(arrayNum);
            }
            else {
                return value;
            }
        };
        Scope.prototype.defineProc = function (name, callback) {
            this.procedures[name] = new types_1.TclProc(name, callback);
        };
        Scope.prototype.disableProc = function (name) {
            if (Object.prototype.hasOwnProperty.call(this.procedures, name)) {
                delete this.procedures[name];
            }
            else {
                throw new tclerror_1.TclError("Can't disable \"" + name + "\": no such function");
            }
        };
        Scope.prototype.resolveProc = function (name) {
            if (Object.prototype.hasOwnProperty.call(this.procedures, name)) {
                return this.procedures[name];
            }
            else if (this.parent !== null) {
                return this.parent.resolveProc(name);
            }
            throw new tclerror_1.TclError("invalid command name " + name);
        };
        return Scope;
    }());
    exports.Scope = Scope;
});
//# sourceMappingURL=scope.js.map