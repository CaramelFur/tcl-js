var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../parser", "../parser/TclToken", "./TclScope", "util", "../nearley/lexers/main", "./variables/TclSimpleVariable", "../parser/WordToken", "../TclError", "./HandleEscape"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TclInterpreter = void 0;
    var parser_1 = require("../parser");
    var TclToken_1 = require("../parser/TclToken");
    var TclScope_1 = require("./TclScope");
    var util = require("util");
    var main_1 = require("../nearley/lexers/main");
    var TclSimpleVariable_1 = require("./variables/TclSimpleVariable");
    var WordToken_1 = require("../parser/WordToken");
    var TclError_1 = require("../TclError");
    var HandleEscape_1 = require("./HandleEscape");
    var debugLexer = false;
    var debugParser = false;
    var TclInterpreter = (function () {
        function TclInterpreter(options, scope) {
            this.options = options;
            this.scope = scope || new TclScope_1.TclScope(options.disableCommands);
        }
        TclInterpreter.prototype.run = function (code) {
            var e_1, _a;
            if (debugLexer) {
                main_1.lexer.reset(code);
                while (1) {
                    var e = main_1.lexer.next();
                    if (!e)
                        break;
                    console.log(e.type, util.inspect(e.value));
                }
            }
            var astTree = parser_1.ParseTcl(code);
            if (debugParser)
                console.log(util.inspect(astTree, false, Infinity, true));
            var lastValue = new TclSimpleVariable_1.TclSimpleVariable('');
            try {
                for (var _b = __values(astTree.commands), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var command = _c.value;
                    if (command instanceof TclToken_1.TclComment)
                        continue;
                    lastValue = this.runCommand(command);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return lastValue;
        };
        TclInterpreter.prototype.runCommand = function (tclcommand) {
            var words = tclcommand.words.map(this.SubstituteWord.bind(this));
            if (words.length === 0) {
                return new TclSimpleVariable_1.TclSimpleVariable('');
            }
            var command = words[0].toString();
            console.log('Executing:', command);
            return new TclSimpleVariable_1.TclSimpleVariable('');
        };
        TclInterpreter.prototype.SubstituteWord = function (word) {
            var parsed = parser_1.ParseWord(word.value);
            var substituted = parsed.map(this.substitutePart.bind(this)).join('');
            console.log(word.value, ':', util.inspect(substituted, false, Infinity, true));
            return new TclSimpleVariable_1.TclSimpleVariable(substituted);
        };
        TclInterpreter.prototype.substitutePart = function (part) {
            if (part instanceof WordToken_1.TextPart) {
                return part.value;
            }
            if (part instanceof WordToken_1.EscapePart) {
                switch (part.type) {
                    case 'normal':
                        return HandleEscape_1.ReplaceEscapeChar(part.backslashValue);
                    case 'octal':
                        return String.fromCharCode(parseInt(part.backslashValue, 8));
                    case 'hex':
                    case 'hex16':
                    case 'hex32':
                        return String.fromCharCode(parseInt(part.backslashValue, 16));
                }
            }
            if (part instanceof WordToken_1.CodePart) {
                return '{code}';
            }
            if (part instanceof WordToken_1.VariablePart) {
                var index = null;
                if (part.index) {
                    index = part.index.map(this.substitutePart.bind(this)).join('');
                }
                if (!this.scope.hasVariable(part.name)) {
                    throw new TclError_1.TclError("can't read \"" + TclScope_1.compileVarName(part.name, index) + "\": no such variable");
                }
                var variable = this.scope.getVariable(part.name, index);
                return variable.toString();
            }
            throw new TclError_1.TclError('Encountered unkown object');
        };
        return TclInterpreter;
    }());
    exports.TclInterpreter = TclInterpreter;
});
//# sourceMappingURL=TclInterpreter.js.map