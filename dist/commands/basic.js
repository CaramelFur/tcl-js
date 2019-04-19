(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../interpreter", "mathjs", "../scope", "../tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var interpreter_1 = require("../interpreter");
    var math = require("mathjs");
    var scope_1 = require("../scope");
    var tclerror_1 = require("../tclerror");
    var commands = {};
    commands.set = function (interpreter, args, varArgs) {
        var varName = args[0], value = args[1];
        if (args.length === 2) {
            interpreter.scope.define(varName, value);
            return value;
        }
        else if (args.length === 1) {
            return interpreter.scope.resolve(varName).getValue();
        }
        throw new tclerror_1.TclError('wrong # args: should be "set varName ?newValue?"');
    };
    commands.unset = function (interpreter, args, varArgs) {
        var nocomplain = false;
        if (args[0] === '-nocomplain') {
            nocomplain = true;
            args.shift();
        }
        if (args.length === 0)
            throw new tclerror_1.TclError('wrong # args: should be "unset ?-nocomplain? varName ?varName ...?"');
        for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
            var arg = args_1[_i];
            interpreter.scope.undefine(arg);
        }
        return '';
    };
    commands.expr = function (interpreter, args, varArgs) {
        if (args.length === 0)
            throw new tclerror_1.TclError('wrong # args: should be "unset arg ?arg arg ...?"');
        var expression = args.join(' ');
        var result = math.eval(expression);
        if (typeof result !== 'number')
            throw new tclerror_1.TclError('expression result is not a number');
        if (result === Infinity)
            throw new tclerror_1.TclError('expression result is Infinity');
        return "" + result;
    };
    commands.eval = function (interpreter, args, varArgs) {
        if (args.length === 0)
            throw new tclerror_1.TclError('wrong # args: should be "eval arg ?arg arg ...?"');
        var code = args.join(' ');
        var newInterpreter = new interpreter_1.Interpreter(interpreter.tcl, code, new scope_1.Scope(interpreter.scope));
        return newInterpreter.run();
    };
    commands.info = function (interpreter, args, varArgs) {
        if (args.length === 0)
            throw new tclerror_1.TclError('wrong # args: should be "info option ?arg arg ...?"');
        var type = args.shift();
        switch (type) {
            case 'commands':
                return 'commands';
        }
        return '';
    };
    function Load(scope) {
        for (var command in commands) {
            scope.defineProc(command, commands[command]);
        }
    }
    exports.Load = Load;
});
//# sourceMappingURL=basic.js.map