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
        define(["require", "exports", "./parser", "./scope", "./types", "./tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var parser_1 = require("./parser");
    var scope_1 = require("./scope");
    var types_1 = require("./types");
    var tclerror_1 = require("./tclerror");
    var variableRegex = /(?<escaped>\\?)\$(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/g;
    var Interpreter = (function () {
        function Interpreter(tcl, input, scope) {
            this.lastValue = '';
            var parser = new parser_1.Parser(input);
            this.program = parser.get();
            this.scope = scope;
            this.tcl = tcl;
        }
        Interpreter.prototype.run = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _i, _a, command, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _i = 0, _a = this.program.commands;
                            _c.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3, 4];
                            command = _a[_i];
                            _b = this;
                            return [4, this.processCommand(command)];
                        case 2:
                            _b.lastValue = _c.sent();
                            _c.label = 3;
                        case 3:
                            _i++;
                            return [3, 1];
                        case 4: return [2, this.lastValue];
                    }
                });
            });
        };
        Interpreter.prototype.processCommand = function (command) {
            return __awaiter(this, void 0, void 0, function () {
                var args, i, _a, _b, wordArgs;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            args = [];
                            i = 0;
                            _c.label = 1;
                        case 1:
                            if (!(i < command.args.length)) return [3, 4];
                            _a = args;
                            _b = i;
                            return [4, this.processArg(command.args[i])];
                        case 2:
                            _a[_b] = _c.sent();
                            _c.label = 3;
                        case 3:
                            i++;
                            return [3, 1];
                        case 4:
                            wordArgs = args.map(function (arg) {
                                try {
                                    return arg.getValue();
                                }
                                catch (e) {
                                    return '';
                                }
                            });
                            return [2, this.scope
                                    .resolveProc(command.command)
                                    .callback(this, wordArgs, args, command)];
                    }
                });
            });
        };
        Interpreter.prototype.processArg = function (arg) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, match, regex;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!arg.hasSubExpr) return [3, 2];
                            _a = arg;
                            return [4, this.processSquareBrackets(arg.value)];
                        case 1:
                            _a.value = _b.sent();
                            _b.label = 2;
                        case 2:
                            if (arg.hasVariable) {
                                match = arg.value.match(variableRegex);
                                if (match && match.length === 1 && match[0] === arg.value) {
                                    regex = variableRegex.exec(arg.value);
                                    if (!regex || !regex.groups || !regex.groups.fullname)
                                        throw new tclerror_1.TclError('Error parsing variable');
                                    if (regex.groups.escaped === '\\')
                                        return [2, new types_1.TclSimple(arg.value.replace(/\\\$/g, '$'))];
                                    return [2, this.scope.resolve(regex.groups.fullname)];
                                }
                                arg.value = arg.value.replace(variableRegex, function () {
                                    var regex = [];
                                    for (var _i = 0; _i < arguments.length; _i++) {
                                        regex[_i] = arguments[_i];
                                    }
                                    var groups = regex[regex.length - 1];
                                    if (groups.escaped === '\\')
                                        return "$" + groups.fullname;
                                    return "" + _this.scope.resolve(groups.fullname).getValue();
                                });
                            }
                            if (!arg.stopBackslash)
                                arg.value = this.processBackSlash(arg.value);
                            return [2, new types_1.TclSimple(arg.value)];
                    }
                });
            });
        };
        Interpreter.prototype.processSquareBrackets = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                function read() {
                    position += 1;
                    char = input.charAt(position);
                }
                var output, depth, position, char, lastExpression, subInterpreter, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            output = input;
                            depth = 0;
                            position = 0;
                            char = input.charAt(position);
                            lastExpression = '';
                            _a.label = 1;
                        case 1:
                            if (!(position < input.length)) return [3, 4];
                            if (!(char === ']')) return [3, 3];
                            depth--;
                            if (!(depth === 0)) return [3, 3];
                            if (!(lastExpression !== '')) return [3, 3];
                            subInterpreter = new Interpreter(this.tcl, lastExpression, new scope_1.Scope(this.scope));
                            return [4, subInterpreter.run()];
                        case 2:
                            result = _a.sent();
                            output = output.replace("[" + lastExpression + "]", result);
                            lastExpression = '';
                            _a.label = 3;
                        case 3:
                            if (depth > 0) {
                                lastExpression += char;
                            }
                            if (char === '[')
                                depth++;
                            read();
                            return [3, 1];
                        case 4:
                            if (depth !== 0)
                                throw new tclerror_1.TclError('incorrect amount of square brackets');
                            return [2, output];
                    }
                });
            });
        };
        Interpreter.prototype.processBackSlash = function (input) {
            var simpleBackRegex = /\\(?<letter>[abfnrtv])/g;
            var octalBackRegex = /\\0(?<octal>[0-7]{0,2})/g;
            var unicodeBackRegex = /\\u(?<hexcode>[0-9a-fA-F]{1,4})/g;
            var hexBackRegex = /\\x(?<hexcode>[0-9a-fA-F]{0,2})/g;
            var cleanUpBackRegex = /\\(?<character>.|\n)/g;
            function codeToChar(hexCode) {
                return String.fromCharCode(hexCode);
            }
            input = input.replace(simpleBackRegex, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var groups = args[args.length - 1];
                switch (groups.letter) {
                    case 'a':
                        return codeToChar(0x07);
                    case 'b':
                        return codeToChar(0x08);
                    case 'f':
                        return codeToChar(0x0c);
                    case 'n':
                        return codeToChar(0x0a);
                    case 'r':
                        return codeToChar(0x0d);
                    case 't':
                        return codeToChar(0x09);
                    case 'v':
                        return codeToChar(0x0b);
                    default:
                        throw new tclerror_1.TclError('program hit unreachable point');
                }
            });
            input = input.replace(octalBackRegex, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var groups = args[args.length - 1];
                var octal = parseInt(groups.octal, 8);
                return codeToChar(octal);
            });
            input = input.replace(unicodeBackRegex, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var groups = args[args.length - 1];
                var hex = parseInt(groups.hexcode, 16);
                return codeToChar(hex);
            });
            input = input.replace(hexBackRegex, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var groups = args[args.length - 1];
                var hex = parseInt(groups.hexcode, 16);
                return codeToChar(hex);
            });
            input = input.replace(cleanUpBackRegex, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var groups = args[args.length - 1];
                switch (groups.character) {
                    case '\n':
                        return ' ';
                    default:
                        return groups.character;
                }
            });
            return input;
        };
        return Interpreter;
    }());
    exports.Interpreter = Interpreter;
});
//# sourceMappingURL=interpreter.js.map