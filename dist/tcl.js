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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
        define(["require", "exports", "fs", "util", "./interpreter/TclScope", "./parser/", "fs", "./TclError", "./interpreter/variables/TclVariable", "./interpreter/TclInterpreter"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Tcl = void 0;
    var fs_1 = require("fs");
    var util = require("util");
    var TclScope_1 = require("./interpreter/TclScope");
    var parser_1 = require("./parser/");
    var fs = require("fs");
    var TclError_1 = require("./TclError");
    var TclVariable_1 = require("./interpreter/variables/TclVariable");
    var TclInterpreter_1 = require("./interpreter/TclInterpreter");
    var tclFile = fs_1.readFileSync('test/test.tcl', 'utf-8');
    var parsed = parser_1.parse(tclFile);
    console.log(util.inspect(parsed, false, Infinity, true));
    var e = function () {
        console.log('hello');
    };
    var Tcl = (function () {
        function Tcl(options) {
            this.options = options || {};
            this.globalScope = new TclScope_1.TclScope();
            this.interpreter = new TclInterpreter_1.TclInterpreter(this.options);
        }
        Tcl.prototype.run = function (code) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2, new TclVariable_1.TclVariable()];
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
                                        reject(new TclError_1.TclError(err.message));
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
        Tcl.prototype.getOptions = function () {
            return __assign({}, this.options);
        };
        return Tcl;
    }());
    exports.Tcl = Tcl;
});
//# sourceMappingURL=tcl.js.map