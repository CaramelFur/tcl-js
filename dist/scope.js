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
    var variableRegex = /(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/;
    var Scope = (function () {
        function Scope(parent) {
            this.parent = null;
            this.members = {};
            parent = parent;
        }
        Scope.prototype.pop = function () {
            return this.parent;
        };
        Scope.prototype.define = function (inputName, inputValue) {
            var regex = variableRegex.exec(inputName);
            if (!regex || !regex.groups)
                throw new Error("Can't read \"" + inputName + "\": invalid variable name");
            var name = regex.groups.name;
            var value;
            if (Object.prototype.hasOwnProperty.call(this.members, name)) {
                value = this.members[name].value;
            }
            else if (this.parent !== null) {
                value = this.parent.resolve(name).value;
            }
            if (regex.groups.object) {
                if (!value)
                    value = {};
                value[regex.groups.object] = inputValue;
            }
            else if (regex.groups.array) {
                if (!value)
                    value = [];
                var arrayNum = parseInt(regex.groups.array, 10);
                value[arrayNum] = inputValue;
            }
            else {
                value = inputValue;
            }
            this.members[name] = new Value(name, value);
            return this;
        };
        Scope.prototype.undefine = function (name, nocomplain) {
            if (!Object.prototype.hasOwnProperty.call(this.members, name) &&
                !nocomplain)
                throw new Error("Can't delete \"" + name + "\": no such variable");
            var returnValue = this.members[name];
            delete this.members[name];
            return returnValue;
        };
        Scope.prototype.resolve = function (inputName) {
            var regex = variableRegex.exec(inputName);
            if (!regex || !regex.groups)
                throw new Error("Can't read \"" + inputName + "\": invalid variable name");
            var name = regex.groups.name;
            var value;
            if (Object.prototype.hasOwnProperty.call(this.members, name)) {
                value = this.members[name].value;
            }
            else if (this.parent !== null) {
                value = this.parent.resolve(name).value;
            }
            if (!value)
                throw new Error("Can't read \"" + name + "\": no such variable");
            if (regex.groups.object) {
                if (typeof value !== 'object')
                    throw new Error("Can't read \"" + name + "\": variable is no object");
                return value[regex.groups.object];
            }
            else if (regex.groups.array) {
                if (!Array.isArray(value))
                    throw new Error("Can't read \"" + name + "\": variable is no array");
                var arrayNum = parseInt(regex.groups.array, 10);
                return value[arrayNum];
            }
            else {
                if (typeof value === 'object')
                    return 'Object';
                if (Array.isArray(value))
                    return 'Array';
                return value;
            }
        };
        return Scope;
    }());
    exports.Scope = Scope;
    var Value = (function () {
        function Value(name, value) {
            this.name = name;
            this.value = value;
        }
        return Value;
    }());
    exports.Value = Value;
});
//# sourceMappingURL=scope.js.map