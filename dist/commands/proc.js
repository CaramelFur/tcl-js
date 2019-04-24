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
            if (args.length !== 3)
                return helpers.sendHelp('wargs');
            for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
                var arg = args_1[_i];
                if (!(arg instanceof types_1.TclSimple))
                    return helpers.sendHelp('wtype');
            }
            var commandArgsString = args[1];
            var command = args[0].getValue();
            var commandArgs = commandArgsString.getList();
            var tclCode = args[2].getValue();
            var commandFunction = function (parsedInterpreter, parsedArgs) {
                if (parsedArgs.length !== commandArgs.getLength())
                    throw new tclerror_1.TclError("wrong # args on procedure \"" + command + "\"");
                var newScope = new scope_1.Scope(undefined, interpreter.tcl.disabledCommands);
                for (var i = 0; i < parsedArgs.length; i++) {
                    var argName = commandArgs.getSubValue(i).getValue();
                    var argValue = parsedArgs[i];
                    newScope.define(argName, argValue);
                }
                var newInterpreter = new interpreter_1.Interpreter(parsedInterpreter.tcl, tclCode, newScope);
                return newInterpreter.run();
            };
            interpreter.scope.defineProc(command, commandFunction);
            return new types_1.TclSimple('');
        }, {
            pattern: 'proc name arguments body',
            helpMessages: {
                wargs: "wrong # args",
                wtype: "wrong type",
            },
        });
    }
    exports.Load = Load;
});
//# sourceMappingURL=proc.js.map