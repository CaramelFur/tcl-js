(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../interpreter", "../types", "../scope", "../tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var interpreter_1 = require("../interpreter");
    var types_1 = require("../types");
    var scope_1 = require("../scope");
    var tclerror_1 = require("../tclerror");
    function Load(scope) {
        scope.defineProc('proc', function (interpreter, args, commandToken, helpers) {
            args = args;
            var commandArgsString = args[1];
            var command = args[0].getValue();
            var commandArgs = commandArgsString.getList();
            var tclCode = args[2].getValue();
            var commandFunction = function (parsedInterpreter, parsedArgs) {
                parsedArgs = parsedArgs;
                if (parsedArgs.length !== commandArgs.getLength())
                    throw new tclerror_1.TclError("wrong # args on procedure \"" + command + "\"");
                var newScope = new scope_1.Scope(undefined, interpreter.getTcl().getDisabledCommands());
                for (var i = 0; i < parsedArgs.length; i++) {
                    var argName = commandArgs.getSubValue(i).getValue();
                    var argValue = parsedArgs[i];
                    newScope.define(argName, argValue);
                }
                var newInterpreter = new interpreter_1.Interpreter(parsedInterpreter.getTcl(), tclCode, newScope);
                return newInterpreter.run();
            };
            interpreter.getScope().defineProc(command, commandFunction);
            return new types_1.TclSimple('');
        }, {
            arguments: {
                amount: 3,
                pattern: 'proc name arguments body',
                simpleOnly: true,
            },
        });
    }
    exports.Load = Load;
});
//# sourceMappingURL=proc.js.map