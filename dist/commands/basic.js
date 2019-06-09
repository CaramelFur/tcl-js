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
        define(["require", "exports", "../interpreter", "../types", "../scope"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var interpreter_1 = require("../interpreter");
    var types_1 = require("../types");
    var scope_1 = require("../scope");
    exports.variableRegex = /(?<fullname>(?<name>[^(\n]+)(\(((?<array>[0-9]+)|(?<object>[^\)]+))\))?)/;
    function Load(scope) {
        var _this = this;
        scope.defineProc('set', function (interpreter, args, command, helpers) {
            var varName = args[0], tclValue = args[1];
            if (args.length === 2) {
                if (!(tclValue instanceof types_1.TclSimple) || !(varName instanceof types_1.TclSimple))
                    return helpers.sendHelp('wtype');
                var solved = solveVar(varName.getValue(), helpers);
                interpreter.setVariable(solved.name, solved.key, tclValue);
                return tclValue;
            }
            else if (args.length === 1) {
                if (!(varName instanceof types_1.TclSimple))
                    return helpers.sendHelp('wtype');
                var solved = solveVar(varName.getValue(), helpers);
                return interpreter.getVariable(solved.name, solved.key);
            }
            return helpers.sendHelp('wargs');
        }, {
            helpMessages: {
                wvarname: "incorrect variable name",
            },
            arguments: {
                pattern: 'set varName ?newValue?',
                amount: {
                    start: 1,
                    end: 2,
                },
            },
        });
        scope.defineProc('unset', function (interpreter, args, command, helpers) {
            args = args;
            var nocomplain = false;
            if (args[0] === '-nocomplain') {
                nocomplain = true;
                args.shift();
            }
            for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
                var arg = args_1[_i];
                var solved = solveVar(arg, helpers);
                interpreter.deleteVariable(solved.name, solved.key, nocomplain);
            }
            return new types_1.TclSimple('');
        }, {
            arguments: {
                pattern: 'unset ?-nocomplain? varName ?varName ...?',
                textOnly: true,
                amount: {
                    start: 1,
                    end: -1,
                },
            },
        });
        scope.defineProc('expr', function (interpreter, args, command, helpers) { return __awaiter(_this, void 0, void 0, function () {
            var expression, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expression = args.join(' ');
                        return [4, helpers.solveExpression(expression)];
                    case 1:
                        result = _a.sent();
                        return [2, new types_1.TclSimple(result.toString())];
                }
            });
        }); }, {
            arguments: {
                textOnly: true,
                pattern: 'expr arg ?arg arg ...?',
                amount: {
                    start: 1,
                    end: -1,
                },
            },
        });
        scope.defineProc('eval', function (interpreter, args, command, helpers) { return __awaiter(_this, void 0, void 0, function () {
            var code, newInterpreter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        code = args.join(' ');
                        newInterpreter = new interpreter_1.Interpreter(interpreter.getTcl(), code, new scope_1.Scope(interpreter.getScope()));
                        return [4, newInterpreter.run()];
                    case 1: return [2, _a.sent()];
                }
            });
        }); }, {
            helpMessages: {
                wargs: "wrong # args",
                wtype: "wrong type",
            },
            arguments: {
                textOnly: true,
                pattern: 'eval arg ?arg arg ...?',
                amount: {
                    start: 1,
                    end: -1,
                },
            },
        });
        scope.defineProc('info', function (interpreter, args, command, helpers) {
            var type = args.shift();
            switch (type) {
                case 'commands':
                    return new types_1.TclSimple('commands');
            }
            return new types_1.TclSimple('');
        }, {
            arguments: {
                pattern: 'info option ?arg arg ...?',
                textOnly: true,
                amount: 1,
            },
        });
        scope.defineProc('wait', function (interpreter, args, command, helpers) { return __awaiter(_this, void 0, void 0, function () {
            var timeout, number, ms;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timeout = function (ms) { return new Promise(function (res) { return setTimeout(res, ms); }); };
                        number = args[0];
                        if (!(number instanceof types_1.TclSimple))
                            return [2, helpers.sendHelp('wtype')];
                        if (!number.isNumber())
                            return [2, helpers.sendHelp('wtype')];
                        ms = number.getNumber(true);
                        return [4, timeout(ms)];
                    case 1:
                        _a.sent();
                        return [2, new types_1.TclSimple('')];
                }
            });
        }); }, {
            arguments: {
                pattern: 'wait time',
                amount: 1,
            },
        });
    }
    exports.Load = Load;
    function solveVar(input, helpers) {
        var result = exports.variableRegex.exec(input);
        if (!result || !result.groups)
            return helpers.sendHelp('wvarname');
        var name = result.groups.name;
        var key = result.groups.object
            ? result.groups.object
            : result.groups.array
                ? parseInt(result.groups.array, 10)
                : null;
        return {
            name: name,
            key: key,
        };
    }
    exports.solveVar = solveVar;
});
//# sourceMappingURL=basic.js.map