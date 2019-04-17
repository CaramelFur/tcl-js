(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../interpreter", "../types", "../scope"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var interpreter_1 = require("../interpreter");
    var types_1 = require("../types");
    var scope_1 = require("../scope");
    var commands = {};
    commands.proc = function (interpreter, args, varArgs) {
        if (varArgs.length !== 3)
            throw new Error('wrong # args: should be "proc name arguments body"');
        var commandArgsString = varArgs[1];
        if (!(commandArgsString instanceof types_1.TclSimple))
            throw new Error('invalid arguments argument');
        var command = args[0];
        var commandArgs = commandArgsString.getList();
        var tclCode = args[2];
        var commandFunction = function (parsedInterpreter, parsedArgs, parsedVarArgs) {
            if (parsedVarArgs.length !== commandArgs.getLength())
                throw new Error("wrong # args on function \"" + command + "\"");
            var newScope = new scope_1.Scope(parsedInterpreter.scope);
            for (var i = 0; i < parsedVarArgs.length; i++) {
                var argName = commandArgs.getSubValue(i).getValue();
                var argValue = parsedVarArgs[i].getValue();
                newScope.define(argName, argValue);
            }
            var newInterpreter = new interpreter_1.Interpreter(parsedInterpreter.tcl, tclCode, newScope);
            return newInterpreter.run();
        };
        interpreter.scope.defineProc(command, commandFunction);
        return '';
    };
    function Load(scope) {
        for (var command in commands) {
            scope.defineProc(command, commands[command]);
        }
    }
    exports.Load = Load;
});
//# sourceMappingURL=proc.js.map