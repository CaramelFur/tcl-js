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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./is", "./tclerror", "util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Is = require("./is");
    var tclerror_1 = require("./tclerror");
    var util_1 = require("util");
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
        TclVariable.prototype.getName = function () {
            return this.name;
        };
        TclVariable.prototype.setName = function (name) {
            this.name = name;
        };
        return TclVariable;
    }());
    exports.TclVariable = TclVariable;
    var TclList = (function (_super) {
        __extends(TclList, _super);
        function TclList(value, name) {
            var _this = _super.call(this, [], name) || this;
            if (typeof value === 'string')
                _this.destruct(value);
            else
                _this.value = value;
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
            function parseBrace() {
                var returnVar = '';
                var depth = 0;
                while (idx < input.length) {
                    if (char === '{') {
                        depth++;
                        if (depth === 1) {
                            read();
                            continue;
                        }
                    }
                    if (char === '}') {
                        depth--;
                        if (depth === 0) {
                            read();
                            break;
                        }
                    }
                    returnVar += read();
                }
                if (depth !== 0)
                    throw new tclerror_1.TclError('incorrect brackets in list');
                if (!Is.WordSeparator(char) && char !== '')
                    throw new tclerror_1.TclError('list element in braces followed by character instead of space');
                return returnVar;
            }
            var i = 0;
            while (idx < input.length) {
                var tempWord = '';
                while (Is.WordSeparator(char) && idx < input.length) {
                    read();
                }
                if (char === '{') {
                    tempWord += parseBrace();
                }
                else {
                    while (!Is.WordSeparator(char) && idx < input.length) {
                        tempWord += read();
                    }
                }
                if (tempWord === '')
                    break;
                this.value[i] = new TclSimple(tempWord);
                i++;
                read();
            }
        };
        TclList.prototype.getValue = function () {
            var toReturn = this.value.map(function (val) { return val.getValue(); });
            toReturn = toReturn.map(function (val) {
                return val.indexOf(' ') > -1 ? "{" + val + "}" : val;
            });
            return toReturn.join(' ');
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
            var out = new TclSimple('');
            for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
                var arg = args_1[_a];
                out = tempList.getSubValue(arg);
                tempList = out.getList();
            }
            return out;
        };
        TclList.prototype.getLength = function () {
            return this.value.length;
        };
        TclList.createList = function (input) {
            var processable = input.slice();
            for (var i = 0; i < processable.length; i++) {
                if (util_1.isArray(processable[i])) {
                    processable[i] = TclList.createList(processable[i]);
                }
            }
            var simpleResults = processable.map(function (r) {
                return r instanceof TclVariable ? r : new TclSimple(r);
            });
            var listResult = new TclList(simpleResults).getSubValue();
            return listResult;
        };
        return TclList;
    }(TclVariable));
    exports.TclList = TclList;
    var TclSimple = (function (_super) {
        __extends(TclSimple, _super);
        function TclSimple(value, name) {
            return _super.call(this, value.toString(), name) || this;
        }
        TclSimple.prototype.getList = function () {
            var list = new TclList(this.value, this.getName());
            return list;
        };
        TclSimple.prototype.getNumber = function (isInt) {
            if (isInt === void 0) { isInt = false; }
            if (this.isNumber())
                return isInt ? parseInt(this.value, 10) : parseFloat(this.value);
            else if (this.isBoolean())
                return this.getBoolean() ? 1 : 0;
            else
                return 0;
        };
        TclSimple.prototype.isNumber = function () {
            return Is.Number(this.value);
        };
        TclSimple.prototype.getBoolean = function () {
            if (this.value === 'true' ||
                this.value === 'on' ||
                this.value === 'yes' ||
                this.value === '1')
                return true;
            else if (this.value === 'false' ||
                this.value === 'off' ||
                this.value === 'no' ||
                this.value === '0')
                return false;
            else if (this.value)
                return true;
            else
                return false;
        };
        TclSimple.prototype.isBoolean = function () {
            return Is.Boolean(this.value);
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
            if (!value) {
                if (Object.keys(this.value).indexOf(name) < 0)
                    throw new tclerror_1.TclError('cannot delete object item, item does not exist');
                delete this.value[name];
            }
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
                throw new tclerror_1.TclError("no value found at given key: " + name);
            return this.value[name];
        };
        TclObject.prototype.getKeys = function () {
            return Object.keys(this.value);
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
                delete this.value[index];
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
        TclArray.prototype.getSubValue = function (index, force) {
            if (index === undefined || index === null)
                return new TclSimple(this.getValue(), this.getName());
            if (!this.value[index]) {
                if (force)
                    return new TclVariable(undefined);
                else
                    throw new tclerror_1.TclError("no value found at given index: " + index);
            }
            return this.value[index];
        };
        TclArray.prototype.getLength = function () {
            return this.value.length;
        };
        return TclArray;
    }(TclVariable));
    exports.TclArray = TclArray;
    var TclProc = (function () {
        function TclProc(name, callback, options) {
            this.options = {
                helpMessages: {
                    wargs: "wrong # args",
                    wtype: "wrong type",
                    wexpression: "expression resolved to unusable value",
                    undefifop: "undefined if operation",
                },
                arguments: {
                    amount: -1,
                    pattern: "blank",
                    textOnly: false,
                    simpleOnly: false,
                },
            };
            this.name = name;
            this.callback = callback;
            if (options) {
                if (options.helpMessages)
                    this.options.helpMessages = __assign({}, this.options.helpMessages, options.helpMessages);
                if (options.arguments) {
                    if (options.arguments.amount)
                        this.options.arguments.amount = options.arguments.amount;
                    if (options.arguments.pattern)
                        this.options.arguments.pattern = options.arguments.pattern;
                    if (options.arguments.textOnly)
                        this.options.arguments.textOnly = options.arguments.textOnly;
                    if (options.arguments.textOnly || options.arguments.simpleOnly)
                        this.options.arguments.simpleOnly = true;
                }
            }
        }
        return TclProc;
    }());
    exports.TclProc = TclProc;
});
//# sourceMappingURL=types.js.map