(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var commands = {};
    commands.set = function (interpreter, args) {
        var varName = args[0], value = args[1];
        if (args.length === 2) {
            interpreter.scope.define(varName, value);
            return value;
        }
        else if (args.length === 1) {
            var symbol = interpreter.scope.resolve(varName);
            return symbol.value;
        }
        throw new Error('wrong # args: should be "set varName ?newValue?"');
    };
    function Load(commandset) {
        for (var command in commands) {
            commandset.define(command, commands[command]);
        }
    }
    exports.Load = Load;
});
//# sourceMappingURL=basic.js.map