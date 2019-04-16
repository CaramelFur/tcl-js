(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./parser", "./scope"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var parser_1 = require("./parser");
    var scope_1 = require("./scope");
    var Interpreter = (function () {
        function Interpreter(tcl, input, scope) {
            var parser = new parser_1.Parser(input);
            this.program = parser.get();
            this.scope = new scope_1.Scope(scope);
            this.io = tcl.io;
            this.commands = tcl.commands;
        }
        Interpreter.prototype.run = function () {
            for (var _i = 0, _a = this.program.commands; _i < _a.length; _i++) {
                var command = _a[_i];
                this.lastValue = this.processCommand(command);
            }
            return this.lastValue;
        };
        Interpreter.prototype.processCommand = function (command) {
            var args = command.args.map(function (value) { return value.value; });
            return this.commands.invoke(this, command.command, args);
        };
        return Interpreter;
    }());
    exports.Interpreter = Interpreter;
});
//# sourceMappingURL=interpreter.js.map