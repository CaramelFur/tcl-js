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
        define(["require", "exports", "../parser", "../parser/TclToken", "./TclScope", "./variables/TclVariable", "util", "./Substitutor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TclInterpreter = void 0;
    var parser_1 = require("../parser");
    var TclToken_1 = require("../parser/TclToken");
    var TclScope_1 = require("./TclScope");
    var TclVariable_1 = require("./variables/TclVariable");
    var util = require("util");
    var Substitutor_1 = require("./Substitutor");
    var TclInterpreter = (function () {
        function TclInterpreter(options, scope) {
            this.options = options;
            this.scope = scope || new TclScope_1.TclScope(options.disableCommands);
        }
        TclInterpreter.prototype.run = function (code) {
            var e_1, _a;
            var astTree = parser_1.ParseTcl(code);
            console.log(util.inspect(astTree, false, Infinity, true));
            var lastValue = new TclVariable_1.TclVariable();
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
        TclInterpreter.prototype.runCommand = function (command) {
            var words = command.words.map(Substitutor_1.SubstituteWord);
            return new TclVariable_1.TclVariable();
        };
        return TclInterpreter;
    }());
    exports.TclInterpreter = TclInterpreter;
});
//# sourceMappingURL=TclInterpreter.js.map