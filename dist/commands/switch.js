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
        define(["require", "exports", "minimatch", "../types", "../scope", "../interpreter", "../tclerror", "../lexer"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var minimatch = require("minimatch");
    var types_1 = require("../types");
    var scope_1 = require("../scope");
    var interpreter_1 = require("../interpreter");
    var tclerror_1 = require("../tclerror");
    var lexer_1 = require("../lexer");
    function Load(scope) {
        var _this = this;
        scope.defineProc('switch', function (interpreter, args, command, helpers) { return __awaiter(_this, void 0, void 0, function () {
            function setType(type) {
                if (options.type !== null)
                    return helpers.sendHelp('wset');
                options.type = type;
            }
            function getCodeAtIndex(index) {
                if (!switchOps[index])
                    return helpers.sendHelp('nocode');
                var code = switchOps[index].code;
                if (code === '-')
                    return getCodeAtIndex(index + 1);
                else
                    return code;
            }
            var options, arg, matchvar, indexvar, matchAgainst, toLex, lexer, token, switchOps, prop, expression, code, runCode, i, op, i, op, i, op, rex, rexResults, listResult, indexv, _i, rexResults_1, rexResult, foundIndex, listResult, i, op, newInterpreter;
            return __generator(this, function (_a) {
                args = args;
                options = {
                    type: null,
                    nocase: false,
                    matchVar: null,
                    indexVar: null,
                };
                while ((arg = args.shift())) {
                    if (!arg.startsWith('-')) {
                        args.unshift(arg);
                        break;
                    }
                    if (arg === '--')
                        break;
                    if (arg === '-exact')
                        setType('exact');
                    else if (arg === '-glob')
                        setType('glob');
                    else if (arg === '-regexp')
                        setType('regexp');
                    else if (arg === '-nocase')
                        options.nocase = true;
                    else if (arg === '-matchvar') {
                        matchvar = args.shift();
                        if (!matchvar)
                            return [2, helpers.sendHelp('wargs')];
                        options.matchVar = matchvar;
                    }
                    else if (arg === '-indexvar') {
                        indexvar = args.shift();
                        if (!indexvar)
                            return [2, helpers.sendHelp('wargs')];
                        options.indexVar = indexvar;
                    }
                    else {
                        throw new tclerror_1.TclError('unrecognized option: ' + arg);
                    }
                }
                if (!options.type)
                    options.type = 'exact';
                if (options.type !== 'regexp' && (options.matchVar || options.indexVar))
                    return [2, helpers.sendHelp('needregexp')];
                matchAgainst = args.shift();
                if (!matchAgainst)
                    return [2, helpers.sendHelp('wargs')];
                if (options.nocase)
                    matchAgainst = matchAgainst.toLowerCase();
                if (args.length === 0)
                    return [2, helpers.sendHelp('wargs')];
                else if (args.length === 1) {
                    toLex = args.shift();
                    if (!toLex)
                        return [2, helpers.sendHelp('wargs')];
                    lexer = new lexer_1.Lexer(toLex);
                    token = void 0;
                    while ((token = lexer.nextToken())) {
                        args.push(token.value);
                    }
                }
                if (args.length <= 1)
                    return [2, helpers.sendHelp('wargs')];
                switchOps = [];
                while ((prop = args.shift())) {
                    expression = prop;
                    code = args.shift();
                    if (!code)
                        return [2, helpers.sendHelp('wargs')];
                    switchOps.push({
                        expression: expression,
                        code: code,
                    });
                }
                runCode = null;
                if (options.type === 'exact') {
                    for (i = 0; i < switchOps.length; i++) {
                        op = switchOps[i];
                        if (options.nocase)
                            op.expression = op.expression.toLowerCase();
                        if (op.expression === 'default')
                            continue;
                        if (op.expression === matchAgainst) {
                            runCode = getCodeAtIndex(i);
                            break;
                        }
                    }
                }
                else if (options.type === 'glob') {
                    for (i = 0; i < switchOps.length; i++) {
                        op = switchOps[i];
                        if (options.nocase)
                            op.expression = op.expression.toLowerCase();
                        if (op.expression === 'default')
                            continue;
                        if (minimatch(matchAgainst, op.expression, { nocomment: true })) {
                            runCode = getCodeAtIndex(i);
                            break;
                        }
                    }
                }
                else if (options.type === 'regexp') {
                    for (i = 0; i < switchOps.length; i++) {
                        op = switchOps[i];
                        if (options.nocase)
                            op.expression = op.expression.toLowerCase();
                        if (op.expression === 'default')
                            continue;
                        rex = new RegExp(op.expression, 'u');
                        rexResults = rex.exec(matchAgainst);
                        if (rexResults !== null) {
                            if (options.matchVar) {
                                listResult = types_1.TclList.createList(rexResults);
                                interpreter.setVariable(options.matchVar, null, listResult);
                            }
                            if (options.indexVar) {
                                indexv = [];
                                for (_i = 0, rexResults_1 = rexResults; _i < rexResults_1.length; _i++) {
                                    rexResult = rexResults_1[_i];
                                    foundIndex = matchAgainst.indexOf(rexResult);
                                    indexv.push([foundIndex, foundIndex + rexResult.length - 1]);
                                }
                                listResult = types_1.TclList.createList(indexv);
                                interpreter.setVariable(options.indexVar, null, listResult);
                            }
                            runCode = getCodeAtIndex(i);
                            break;
                        }
                    }
                }
                else {
                    throw new types_1.TclSimple('invalid switchtype');
                }
                if (!runCode) {
                    for (i = 0; i < switchOps.length; i++) {
                        op = switchOps[i];
                        op.expression = op.expression.toLowerCase();
                        if (op.expression === 'default') {
                            runCode = getCodeAtIndex(i);
                            break;
                        }
                    }
                    if (!runCode)
                        return [2, new types_1.TclSimple('')];
                }
                newInterpreter = new interpreter_1.Interpreter(interpreter.getTcl(), runCode, new scope_1.Scope(interpreter.getScope()));
                return [2, newInterpreter.run()];
            });
        }); }, {
            arguments: {
                pattern: "switch ?options? string { pattern1 { body1 } ?pattern2 { body2 }? ... ?patternN { bodyN }? }",
                textOnly: true,
                amount: {
                    start: 2,
                    end: -1,
                },
            },
            helpMessages: {
                wset: 'type of switch was already set',
                needregexp: 'You need the -regexp flag enabled to use -indexvar or -matchvar',
                nocode: 'there was no executable code to be found with the correct expression',
            },
        });
    }
    exports.Load = Load;
});
//# sourceMappingURL=switch.js.map