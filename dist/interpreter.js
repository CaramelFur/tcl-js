(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./parser", "./scope", "./types"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var parser_1 = require("./parser");
    var scope_1 = require("./scope");
    var types_1 = require("./types");
    var variableRegex = /\$(?<fullname>(?<name>[a-zA-Z0-9_]+)(\(((?<array>[0-9]+)|(?<object>[a-zA-Z0-9_]+))\))?)/g;
    var Interpreter = (function () {
        function Interpreter(tcl, input, scope) {
            var parser = new parser_1.Parser(input);
            this.program = parser.get();
            this.scope = scope;
            this.tcl = tcl;
        }
        Interpreter.prototype.run = function () {
            for (var _i = 0, _a = this.program.commands; _i < _a.length; _i++) {
                var command = _a[_i];
                this.lastValue = this.processCommand(command);
            }
            return this.lastValue;
        };
        Interpreter.prototype.processCommand = function (command) {
            var _this = this;
            var args = command.args.map(function (arg) {
                if (arg.hasVariable) {
                    var match = arg.value.match(variableRegex);
                    if (match && match.length === 1 && match[0] === arg.value) {
                        var regex = variableRegex.exec(arg.value);
                        if (!regex || !regex.groups || !regex.groups.fullname)
                            throw new Error('Error parsing variable');
                        return _this.scope.resolve(regex.groups.fullname);
                    }
                    arg.value = arg.value.replace(variableRegex, function () {
                        var regex = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            regex[_i] = arguments[_i];
                        }
                        var groups = regex[regex.length - 1];
                        return "" + _this.scope.resolve(groups.fullname).getValue();
                    });
                }
                if (arg.hasSubExpr) {
                    var subInterpreter = new Interpreter(_this.tcl, arg.value, new scope_1.Scope(_this.scope));
                    arg.value = subInterpreter.run();
                }
                return new types_1.TclSimple(arg.value);
            });
            var wordArgs = args.map(function (arg) { return arg.getValue(); });
            return this.scope.resolveProc(command.command).callback(this, wordArgs, args);
        };
        return Interpreter;
    }());
    exports.Interpreter = Interpreter;
});
//# sourceMappingURL=interpreter.js.map