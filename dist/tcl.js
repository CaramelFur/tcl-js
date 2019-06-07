var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./scope", "./io", "fs", "./interpreter", "./types", "./tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var scope_1 = require("./scope");
    var io_1 = require("./io");
    var fs = require("fs");
    var interpreter_1 = require("./interpreter");
    var types_1 = require("./types");
    var tclerror_1 = require("./tclerror");
    var Tcl = (function () {
        function Tcl(disableCommands) {
            this.io = new io_1.IO();
            this.disabledCommands = [];
            if (disableCommands)
                this.disabledCommands = disableCommands;
            this.globalScope = new scope_1.Scope(undefined, this.disabledCommands);
        }
        Tcl.prototype.run = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                var interpreter;
                return __generator(this, function (_a) {
                    interpreter = new interpreter_1.Interpreter(this, input, new scope_1.Scope(this.globalScope));
                    return [2, interpreter.run()];
                });
            });
        };
        Tcl.prototype.runFile = function (location) {
            return __awaiter(this, void 0, void 0, function () {
                var buffer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, new Promise(function (resolve, reject) {
                                fs.readFile(location, { encoding: 'utf-8' }, function (err, data) {
                                    if (err)
                                        reject(new tclerror_1.TclError(err.message));
                                    resolve(data);
                                });
                            })];
                        case 1:
                            buffer = _a.sent();
                            return [2, this.run(buffer)];
                    }
                });
            });
        };
        Tcl.prototype.addSimpleProcedure = function (name, procedure) {
            var _this = this;
            return this.globalScope.defineProc(name, function (interpreter, inArgs, command, helpers) { return __awaiter(_this, void 0, void 0, function () {
                var out, args;
                return __generator(this, function (_a) {
                    inArgs = inArgs;
                    args = inArgs.map(function (arg) { return arg.getValue(); });
                    out = procedure.apply(void 0, args);
                    if (!out)
                        out = '';
                    return [2, new types_1.TclSimple(out)];
                });
            }); }, { arguments: { simpleOnly: true } });
        };
        Tcl.prototype.addAdvancedProcedure = function (name, procedure, settings) {
            return this.globalScope.defineProc(name, procedure, settings);
        };
        Tcl.prototype.setVariable = function (name, variable, force) {
            if (!force) {
                var test = this.globalScope.resolve(name);
                if (test)
                    throw new Error('Variable ' + name + ' has already been set!');
            }
            if (Array.isArray(variable)) {
                var saveVar = new types_1.TclArray(undefined, name);
                for (var i = 0; i < variable.length; i++) {
                    var item = variable[i];
                    var converted = void 0;
                    if (typeof item === 'string' ||
                        typeof item === 'number' ||
                        typeof item === 'boolean') {
                        converted = item.toString();
                    }
                    else {
                        converted = item.toString();
                    }
                    var saveSimple = new types_1.TclSimple(converted);
                    saveVar.set(i, saveSimple);
                }
                this.globalScope.define(name, saveVar);
                return true;
            }
            else if (variable instanceof Object) {
                var saveVar = new types_1.TclObject(undefined, name);
                for (var _i = 0, _a = Object.keys(variable); _i < _a.length; _i++) {
                    var key = _a[_i];
                    var item = variable[key];
                    var converted = void 0;
                    if (typeof item === 'string' ||
                        typeof item === 'number' ||
                        typeof item === 'boolean') {
                        converted = item.toString();
                    }
                    else {
                        converted = item.toString();
                    }
                    var saveSimple = new types_1.TclSimple(converted);
                    saveVar.set(key, saveSimple);
                }
                this.globalScope.define(name, saveVar);
                return true;
            }
            else if (typeof variable === 'string' ||
                typeof variable === 'number' ||
                typeof variable === 'boolean') {
                var out = variable.toString();
                var saveVar = new types_1.TclSimple(out, name);
                this.globalScope.define(name, saveVar);
                return true;
            }
            else {
                throw new Error('Unsupported variable type!');
            }
        };
        Tcl.prototype.getVariable = function (name, force) {
            var gotten = this.globalScope.resolve(name);
            if (!gotten) {
                if (!force)
                    throw new Error('Could not find variable');
                else
                    return '';
            }
            if (gotten instanceof types_1.TclSimple) {
                if (gotten.isNumber())
                    return gotten.getNumber();
                else if (gotten.isBoolean())
                    return gotten.getBoolean();
                else
                    return gotten.getValue();
            }
            else if (gotten instanceof types_1.TclArray) {
                var out = [];
                var length_1 = gotten.getLength();
                for (var i = 0; i < length_1; i++) {
                    var item = gotten.getSubValue(i, true);
                    if (item instanceof types_1.TclSimple && item.isNumber())
                        out.push(item.getNumber());
                    else if (item instanceof types_1.TclSimple && item.isBoolean())
                        out.push(item.getBoolean());
                    else
                        out.push(item.getValue());
                }
                return out;
            }
            else if (gotten instanceof types_1.TclObject) {
                var out = {};
                var keys = gotten.getKeys();
                for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var key = keys_1[_i];
                    var item = gotten.getSubValue(key);
                    if (item instanceof types_1.TclSimple && item.isNumber())
                        out[key] = item.getNumber();
                    else if (item instanceof types_1.TclSimple && item.isBoolean())
                        out[key] = item.getBoolean();
                    else
                        out[key] = item.getValue();
                }
                return out;
            }
            else {
                if (!force)
                    throw new Error('Could not convert variable to js equivalent');
                else
                    return '';
            }
        };
        Tcl.prototype.getDisabledCommands = function () {
            return this.disabledCommands;
        };
        Tcl.prototype.getIO = function () {
            return this.io;
        };
        return Tcl;
    }());
    exports.Tcl = Tcl;
});
//# sourceMappingURL=tcl.js.map