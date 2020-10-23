(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../parser", "../parser/TclToken", "./TclScope", "./variables/TclVariable", "util"], factory);
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
    var TclInterpreter = (function () {
        function TclInterpreter(options, scope) {
            this.options = options;
            this.scope = scope || new TclScope_1.TclScope(options.disableCommands);
        }
        TclInterpreter.prototype.run = function (code) {
            var astTree = parser_1.ParseTcl(code);
            console.log(util.inspect(astTree, false, Infinity, true));
            var lastValue = new TclVariable_1.TclVariable();
            for (var _i = 0, _a = astTree.commands; _i < _a.length; _i++) {
                var command = _a[_i];
                if (command instanceof TclToken_1.TclComment)
                    continue;
                lastValue = this.runCommand(command);
            }
            return lastValue;
        };
        TclInterpreter.prototype.runCommand = function (command) {
            var words = command.words.map(this.substituteWord);
            return new TclVariable_1.TclVariable();
        };
        TclInterpreter.prototype.substituteWord = function (word) {
            var parsed = parser_1.ParseWord(word.value);
            console.log(word.value, ':', util.inspect(parsed, false, Infinity, true));
            return new TclVariable_1.TclVariable(word.value);
        };
        return TclInterpreter;
    }());
    exports.TclInterpreter = TclInterpreter;
});
//# sourceMappingURL=TclInterpreter.js.map