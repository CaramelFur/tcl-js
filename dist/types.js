var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./is", "./tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Is = require("./is");
    var tclerror_1 = require("./tclerror");
    var TclVariable = (function () {
        function TclVariable(value, name) {
            this.value = '';
            this.name = undefined;
            this.value = value;
            if (name)
                this.name = name;
        }
        TclVariable.prototype.getValue = function () {
            return this.value;
        };
        TclVariable.prototype.setValue = function (value) {
            this.value = value;
            return value;
        };
        TclVariable.prototype.getSubValue = function (key) {
            return undefined;
        };
        TclVariable.prototype.getRawValue = function () {
            return this.value;
        };
        TclVariable.prototype.getName = function () {
            return this.name;
        };
        TclVariable.prototype.getNumber = function (isInt) {
            return undefined;
        };
        TclVariable.prototype.isNumber = function () {
            return false;
        };
        return TclVariable;
    }());
    exports.TclVariable = TclVariable;
    var TclList = (function (_super) {
        __extends(TclList, _super);
        function TclList(value, name) {
            var _this = _super.call(this, [], name) || this;
            _this.destruct(value);
            return _this;
        }
        TclList.prototype.destruct = function (input) {
            var idx = 0;
            var char = input.charAt(idx);
            function read() {
                var old = char;
                idx += 1;
                char = input.charAt(idx);
                return old;
            }
            function parseBrace(depth) {
                if (depth === void 0) { depth = 0; }
                var returnVar = '';
                read();
                while (depth > 0) {
                    returnVar += read();
                    if (char === '{')
                        depth++;
                    if (char === '}')
                        depth--;
                }
                if (depth < 0)
                    throw new tclerror_1.TclError('incorrect brackets in list');
                read();
                return returnVar;
            }
            var i = 0;
            while (idx < input.length) {
                var tempWord = '';
                while (!Is.WordSeparator(char) && idx < input.length) {
                    if (char === '{') {
                        if (tempWord !== '')
                            throw new tclerror_1.TclError('unexpected {');
                        this.value[i] = new TclSimple(parseBrace(1));
                    }
                    else {
                        if (this.value[i])
                            throw new tclerror_1.TclError('unexpected text after }');
                        tempWord += read();
                    }
                }
                if (this.value[i] || tempWord !== '') {
                    this.value[i] = this.value[i] || new TclSimple(tempWord);
                    i++;
                }
                read();
            }
        };
        TclList.prototype.set = function (index, value) {
            if (!value) {
                if (!this.value[index])
                    throw new tclerror_1.TclError('cannot delete list item, item does not exist');
                this.value.splice(index, 1);
            }
            else {
                this.value[index] = value;
            }
            return value;
        };
        TclList.prototype.unset = function (index) {
            this.set(index);
        };
        TclList.prototype.getValue = function () {
            return this.value.map(function (val) { return val.getValue(); }).join(' ');
        };
        TclList.prototype.getSubValue = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (args.length === 0)
                return new TclSimple(this.getValue(), this.getName());
            if (args.length === 1) {
                if (this.value[args[0]])
                    return this.value[args[0]];
                else
                    return new TclSimple('');
            }
            var tempList = this;
            var out;
            for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
                var arg = args_1[_a];
                if (!tempList)
                    throw new tclerror_1.TclError('item is no list');
                out = tempList.getSubValue(arg);
                if (out instanceof TclSimple)
                    tempList = out.getList();
                else
                    tempList = undefined;
            }
            if (!out)
                throw new tclerror_1.TclError('no such element in array');
            return out;
        };
        TclList.prototype.getLength = function () {
            return this.value.length;
        };
        return TclList;
    }(TclVariable));
    exports.TclList = TclList;
    var TclSimple = (function (_super) {
        __extends(TclSimple, _super);
        function TclSimple(value, name) {
            return _super.call(this, value, name) || this;
        }
        TclSimple.prototype.getList = function () {
            var list = new TclList(this.value, this.getName());
            return list;
        };
        TclSimple.prototype.getNumber = function (isInt) {
            if (isInt === void 0) { isInt = false; }
            if (this.isNumber())
                return isInt ? parseInt(this.value, 10) : parseFloat(this.value);
            else
                return undefined;
        };
        TclSimple.prototype.isNumber = function () {
            return Is.Number(this.value);
        };
        return TclSimple;
    }(TclVariable));
    exports.TclSimple = TclSimple;
    var TclObject = (function (_super) {
        __extends(TclObject, _super);
        function TclObject(value, name) {
            var _this = _super.call(this, value, name) || this;
            if (!_this.value)
                _this.value = {};
            return _this;
        }
        TclObject.prototype.set = function (name, value) {
            if (name === '')
                throw new tclerror_1.TclError('invalid object key');
            if (!value)
                delete this.value[name];
            else
                this.value[name] = value;
            return value;
        };
        TclObject.prototype.unset = function (name) {
            this.set(name);
        };
        TclObject.prototype.getValue = function () {
            throw new tclerror_1.TclError("can't read \"" + this.getName() + "\": variable is object");
        };
        TclObject.prototype.getSubValue = function (name) {
            if (name === '')
                return new TclSimple(this.getValue(), this.getName());
            if (!this.value[name])
                throw new tclerror_1.TclError('no value found at given key');
            return this.value[name];
        };
        TclObject.prototype.getSize = function () {
            return Object.keys(this.value).length;
        };
        return TclObject;
    }(TclVariable));
    exports.TclObject = TclObject;
    var TclArray = (function (_super) {
        __extends(TclArray, _super);
        function TclArray(value, name) {
            var _this = _super.call(this, value, name) || this;
            if (!_this.value)
                _this.value = [];
            return _this;
        }
        TclArray.prototype.set = function (index, value) {
            if (!value) {
                if (!this.value[index])
                    throw new tclerror_1.TclError('cannot delete array item, item does not exist');
                this.value.splice(index, 1);
            }
            else {
                this.value[index] = value;
            }
            return value;
        };
        TclArray.prototype.unset = function (index) {
            this.set(index);
        };
        TclArray.prototype.getValue = function () {
            throw new tclerror_1.TclError("can't read \"" + this.getName() + "\": variable is array");
        };
        TclArray.prototype.getSubValue = function (index) {
            if (index === undefined || index === null)
                return new TclSimple(this.getValue(), this.getName());
            if (!this.value[index])
                throw new tclerror_1.TclError('no value found at given index');
            return this.value[index];
        };
        TclArray.prototype.getLength = function () {
            return this.value.length;
        };
        return TclArray;
    }(TclVariable));
    exports.TclArray = TclArray;
    var TclProc = (function () {
        function TclProc(name, callback) {
            this.name = name;
            this.callback = callback;
        }
        return TclProc;
    }());
    exports.TclProc = TclProc;
});
//# sourceMappingURL=types.js.map