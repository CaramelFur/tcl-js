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
            var args = command.args.map(this.processArg.bind(this));
            var wordArgs = args.map(function (arg) {
                try {
                    return arg.getValue();
                }
                catch (e) {
                    return '';
                }
            });
            return this.scope
                .resolveProc(command.command)
                .callback(this, wordArgs, args);
        };
        Interpreter.prototype.processArg = function (arg) {
            var _this = this;
            if (arg.hasVariable) {
                var match = arg.value.match(variableRegex);
                if (match && match.length === 1 && match[0] === arg.value) {
                    var regex = variableRegex.exec(arg.value);
                    if (!regex || !regex.groups || !regex.groups.fullname)
                        throw new tclerror_1.TclError('Error parsing variable');
                    return this.scope.resolve(regex.groups.fullname);
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
                var subInterpreter = new Interpreter(this.tcl, arg.value, new scope_1.Scope(this.scope));
                arg.value = subInterpreter.run();
            }
            return new types_1.TclSimple(arg.value);
        };
        return Interpreter;
    }());
    exports.Interpreter = Interpreter;
});
//# sourceMappingURL=interpreter.js.map