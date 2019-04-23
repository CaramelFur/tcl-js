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
        define(["require", "exports", "../interpreter", "mathjs", "../scope", "../tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    var _this = this;
    Object.defineProperty(exports, "__esModule", { value: true });
    var interpreter_1 = require("../interpreter");
    var math = require("mathjs");
    var scope_1 = require("../scope");
    var tclerror_1 = require("../tclerror");
    var commands = {};
    commands.set = function (interpreter, args, varArgs, command) {
        var varName = args[0], value = args[1];
        if (args.length === 2) {
            interpreter.scope.define(varName, value);
            return value;
        }
        else if (args.length === 1) {
            return interpreter.scope.resolve(varName).getValue();
        }
        throw new tclerror_1.TclError("wrong # args: should be \"set varName ?newValue?\"\nwhile reading: \"" + command.codeLine + "\"");
    };
    commands.unset = function (interpreter, args, varArgs) {
        var nocomplain = false;
        if (args[0] === '-nocomplain') {
            nocomplain = true;
            args.shift();
        }
        if (args.length === 0)
            throw new tclerror_1.TclError('wrong # args: should be "unset ?-nocomplain? varName ?varName ...?"');
        for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
            var arg = args_1[_i];
            interpreter.scope.undefine(arg);
        }
        return '';
    };
    commands.expr = function (interpreter, args, varArgs) {
        if (args.length === 0)
            throw new tclerror_1.TclError('wrong # args: should be "unset arg ?arg arg ...?"');
        var expression = args.join(' ');
        var result = math.eval(expression);
        if (typeof result !== 'number')
            throw new tclerror_1.TclError('expression result is not a number');
        if (result === Infinity)
            throw new tclerror_1.TclError('expression result is Infinity');
        return "" + result;
    };
    commands.eval = function (interpreter, args, varArgs) { return __awaiter(_this, void 0, void 0, function () {
        var code, newInterpreter;
        return __generator(this, function (_a) {
            if (args.length === 0)
                throw new tclerror_1.TclError('wrong # args: should be "eval arg ?arg arg ...?"');
            code = args.join(' ');
            newInterpreter = new interpreter_1.Interpreter(interpreter.tcl, code, new scope_1.Scope(interpreter.scope));
            return [2, newInterpreter.run()];
        });
    }); };
    commands.info = function (interpreter, args, varArgs) {
        if (args.length === 0)
            throw new tclerror_1.TclError('wrong # args: should be "info option ?arg arg ...?"');
        var type = args.shift();
        switch (type) {
            case 'commands':
                return 'commands';
        }
        return '';
    };
    commands.wait = function (interpreter, args, varArgs) { return __awaiter(_this, void 0, void 0, function () {
        var timeout;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    timeout = function (ms) { return new Promise(function (res) { return setTimeout(res, ms); }); };
                    return [4, timeout(2000)];
                case 1:
                    _a.sent();
                    return [2, 'wow'];
            }
        });
    }); };
    function Load(scope) {
        for (var command in commands) {
            scope.defineProc(command, commands[command]);
        }
    }
    exports.Load = Load;
});
//# sourceMappingURL=basic.js.map