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
        define(["require", "exports", "./parser", "./types", "./tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var parser_1 = require("./parser");
    var types_1 = require("./types");
    var tclerror_1 = require("./tclerror");
    var Interpreter = (function () {
        function Interpreter(tcl, input, scope) {
            this.lastValue = new types_1.TclSimple('');
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
                var args, i, _a, _b, proc, helpers;
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
                            proc = this.scope.resolveProc(command.command);
                            if (!proc)
                                throw new tclerror_1.TclError("invalid command name \"" + name + "\"");
                            helpers = {
                                sendHelp: function (helpType) {
                                    var options = proc.options;
                                    var message = options.helpMessages[helpType] || 'Error';
                                    if (options.pattern)
                                        message += ": should be \"" + options.pattern + "\"";
                                    throw new tclerror_1.TclError(message + "\n    while reading: \"" + command.source + "\"\n    at line #" + command.sourceLocation + "\n");
                                },
                            };
                            return [2, proc.callback(this, args, command, helpers)];
                    }
                });
            });
        };
        Interpreter.prototype.processArg = function (arg) {
            return __awaiter(this, void 0, void 0, function () {
                var output;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            output = arg.value;
                            if (!(arg.hasSubExpr && typeof output === 'string')) return [3, 2];
                            return [4, this.processSquareBrackets(output)];
                        case 1:
                            output = _a.sent();
                            _a.label = 2;
                        case 2:
                            if (!(arg.hasVariable && typeof output === 'string')) return [3, 4];
                            return [4, this.deepProcessVariables(output)];
                        case 3:
                            output = _a.sent();
                            _a.label = 4;
                        case 4:
                            if (!arg.stopBackslash && typeof output === 'string')
                                output = this.processBackSlash(output);
                            if (typeof output === 'string')
                                output = output.replace(/\\\n/g, ' ');
                            return [2, typeof output === 'string' ? new types_1.TclSimple(output) : output];
                    }
                });
            });
        };
        Interpreter.prototype.deepProcessVariables = function (input, position) {
            if (position === void 0) { position = 0; }
            return __awaiter(this, void 0, void 0, function () {
                var output, toProcess;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            output = "";
                            _a.label = 1;
                        case 1: return [4, this.resolveFirstVariable(input, position)];
                        case 2:
                            if (!(toProcess = _a.sent())) return [3, 3];
                            while (position < toProcess.startPosition) {
                                output += input.charAt(position);
                                position++;
                            }
                            position = toProcess.endPosition;
                            if (toProcess.raw === input)
                                return [2, toProcess.value];
                            output += toProcess.value.getValue();
                            return [3, 1];
                        case 3:
                            while (position < input.length) {
                                output += input.charAt(position);
                                position++;
                            }
                            return [2, output];
                    }
                });
            });
        };
        Interpreter.prototype.resolveFirstVariable = function (input, position) {
            if (position === void 0) { position = 0; }
            return __awaiter(this, void 0, void 0, function () {
                function read(appendOnOriginal) {
                    if (appendOnOriginal)
                        currentVar.originalString += char;
                    position += 1;
                    char = input.charAt(position);
                }
                var char, currentVar, inBracket, startPosition, replaceVar, index, solved;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            char = input.charAt(position);
                            currentVar = {
                                name: '',
                                bracket: '',
                                originalString: '',
                                curly: false,
                            };
                            inBracket = false;
                            while (char !== '$' && position < input.length) {
                                if (char === '\\')
                                    read(false);
                                read(false);
                            }
                            if (char !== '$')
                                return [2, null];
                            char = char;
                            startPosition = position;
                            read(true);
                            if (char === '{') {
                                currentVar.curly = true;
                                read(true);
                            }
                            _a.label = 1;
                        case 1:
                            if (!(position < input.length)) return [3, 6];
                            if (!inBracket) return [3, 4];
                            if (char === ')') {
                                inBracket = false;
                                read(true);
                                return [3, 6];
                            }
                            if (!(char === '$')) return [3, 3];
                            return [4, this.resolveFirstVariable(input, position)];
                        case 2:
                            replaceVar = _a.sent();
                            if (replaceVar) {
                                while (position < replaceVar.endPosition) {
                                    read(true);
                                }
                                currentVar.bracket += replaceVar.value.getValue();
                                return [3, 1];
                            }
                            _a.label = 3;
                        case 3: return [3, 5];
                        case 4:
                            if (char === '(') {
                                inBracket = true;
                                read(true);
                                return [3, 1];
                            }
                            if (!currentVar.curly && !char.match(/\w/g))
                                return [3, 6];
                            _a.label = 5;
                        case 5:
                            if (currentVar.curly && char === '}')
                                return [3, 6];
                            if (char === '\\') {
                                if (inBracket)
                                    currentVar.bracket += char;
                                else
                                    currentVar.name += char;
                                read(true);
                            }
                            if (inBracket)
                                currentVar.bracket += char;
                            else
                                currentVar.name += char;
                            read(true);
                            return [3, 1];
                        case 6:
                            if (currentVar.curly) {
                                if (char !== '}')
                                    throw new tclerror_1.TclError('unexpected end of string');
                                read(true);
                            }
                            if (currentVar.name === '')
                                return [2, this.resolveFirstVariable(input, position)];
                            solved = currentVar.bracket;
                            if (solved === '')
                                index = null;
                            else if (isNumber(solved))
                                index = parseInt(solved, 10);
                            else
                                index = solved;
                            return [2, {
                                    raw: currentVar.originalString,
                                    startPosition: startPosition,
                                    endPosition: position,
                                    value: this.getVariable(currentVar.name, index),
                                }];
                    }
                });
            });
        };
        Interpreter.prototype.getVariable = function (variableName, variableKey) {
            var name = variableName;
            var objectKey = typeof variableKey === 'string' ? variableKey : undefined;
            var arrayIndex = typeof variableKey === 'number' ? variableKey : undefined;
            var value = this.scope.resolve(name);
            if (!value)
                throw new tclerror_1.TclError("can't read \"" + name + "\": no such variable");
            if (objectKey) {
                if (!(value instanceof types_1.TclObject))
                    throw new tclerror_1.TclError("can't read \"" + name + "\": variable isn't object");
                return value.getSubValue(objectKey);
            }
            else if (arrayIndex) {
                if (!(value instanceof types_1.TclArray))
                    throw new tclerror_1.TclError("can't read \"" + name + "\": variable isn't array");
                return value.getSubValue(arrayIndex);
            }
            else {
                return value;
            }
        };
        Interpreter.prototype.setVariable = function (variableName, variableKey, variable) {
            var name = variableName;
            var objectKey = typeof variableKey === 'string' ? variableKey : undefined;
            var arrayIndex = typeof variableKey === 'number' ? variableKey : undefined;
            var output = variable;
            var existingValue = this.scope.resolve(name);
            if (objectKey) {
                if (existingValue) {
                    if (!(existingValue instanceof types_1.TclObject))
                        throw new tclerror_1.TclError("cant' set \"" + variableName + "\": variable isn't object");
                    existingValue.set(objectKey, variable);
                    return;
                }
                var obj = new types_1.TclObject(undefined, name);
                obj.set(objectKey, variable);
                output = obj;
            }
            else if (arrayIndex) {
                if (existingValue) {
                    if (!(existingValue instanceof types_1.TclArray))
                        throw new tclerror_1.TclError("cant' set \"" + variableName + "\": variable isn't array");
                    existingValue.set(arrayIndex, variable);
                    return;
                }
                var arr = new types_1.TclArray(undefined, name);
                arr.set(arrayIndex, variable);
                output = arr;
            }
            else {
                if (existingValue instanceof types_1.TclObject)
                    throw new tclerror_1.TclError("cant' set \"" + variableName + "\": variable is object");
                if (existingValue instanceof types_1.TclArray)
                    throw new tclerror_1.TclError("cant' set \"" + variableName + "\": variable is array");
                if (existingValue instanceof types_1.TclList)
                    throw new tclerror_1.TclError("cant' set \"" + variableName + "\": variable is list");
            }
            output.setName(name);
            this.scope.define(name, output);
            return;
        };
        Interpreter.prototype.processSquareBrackets = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                function read() {
                    position += 1;
                    char = input.charAt(position);
                }
                var output, depth, position, char, lastExpression, subInterpreter, result, replaceVal;
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
                            if (!(position < input.length)) return [3, 6];
                            if (!(char === ']')) return [3, 5];
                            depth--;
                            if (!(depth === 0)) return [3, 4];
                            if (!(lastExpression !== '')) return [3, 3];
                            subInterpreter = new Interpreter(this.tcl, lastExpression, this.scope);
                            return [4, subInterpreter.run()];
                        case 2:
                            result = _a.sent();
                            replaceVal = "[" + lastExpression + "]";
                            if (output === replaceVal)
                                return [2, result];
                            output = output.replace(replaceVal, result.getValue());
                            lastExpression = '';
                            _a.label = 3;
                        case 3: return [3, 5];
                        case 4:
                            if (depth < 0)
                                throw new tclerror_1.TclError('unexpected ]');
                            _a.label = 5;
                        case 5:
                            if (depth > 0) {
                                lastExpression += char;
                            }
                            if (char === '[')
                                depth++;
                            read();
                            return [3, 1];
                        case 6:
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
            var cleanUpBackRegex = /\\(?<character>.)/g;
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
                return groups.character;
            });
            return input;
        };
        return Interpreter;
    }());
    exports.Interpreter = Interpreter;
    function isNumber(input) {
        return !isNaN(input) && !isNaN(parseInt(input, 10));
    }
    exports.isNumber = isNumber;
});
//# sourceMappingURL=interpreter.js.map