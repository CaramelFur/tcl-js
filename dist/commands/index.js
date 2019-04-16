(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./commands"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var commands_1 = require("./commands");
    var CommandSet = (function () {
        function CommandSet(interpreter) {
            this.commands = {};
            this.interpreter = interpreter;
            for (var _i = 0, LoadFunctions_1 = commands_1.LoadFunctions; _i < LoadFunctions_1.length; _i++) {
                var loadFunc = LoadFunctions_1[_i];
                loadFunc(this);
            }
        }
        CommandSet.prototype.define = function (name, fn) {
            this.commands[name] = fn;
            return this;
        };
        CommandSet.prototype.invoke = function (cmd, args) {
            if (!Object.prototype.hasOwnProperty.call(this.commands, cmd)) {
                throw new Error("invalid command name " + cmd);
            }
            return this.commands[cmd](this.interpreter, args);
        };
        return CommandSet;
    }());
    exports.CommandSet = CommandSet;
});
//# sourceMappingURL=index.js.map