(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "mathjs", "../tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var math = require("mathjs");
    var tclerror_1 = require("../tclerror");
    var commands = {};
    commands.set = function (interpreter, args, varArgs) {
        var varName = args[0], value = args[1];
        if (args.length === 2) {
            interpreter.scope.define(varName, value);
            return value;
        }
        else if (args.length === 1) {
            return interpreter.scope.resolve(varName);
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
        try {
            return math.eval(expression);
        }
        catch (e) {
            throw new tclerror_1.TclError('invalid expression');
        }
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