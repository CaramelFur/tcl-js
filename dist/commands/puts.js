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
    commands.puts = function (interpreter, args, varArgs) {
        var nonewline = false;
        var channelId = 'stdout';
        var string = '';
        if (args.length === 1) {
            string = args[0];
        }
        else if (args.length === 2 && args[0] === '-nonewline') {
            nonewline = true;
            string = args[1];
        }
        else if (args.length === 2) {
            channelId = args[0];
            string = args[1];
        }
        else if (args.length === 3 && args[0] === '-nonewline') {
            nonewline = true;
            channelId = args[1];
            string = args[2];
        }
        else {
            throw new Error('wrong # args: should be "puts ?-nonewline? ?channelId? string"');
        }
        interpreter.tcl.io.write(channelId, "" + string + (nonewline ? '' : '\n'));
        return string;
    };
    function Load(commandset) {
        for (var command in commands) {
            commandset.define(command, commands[command]);
        }
    }
    exports.Load = Load;
});
//# sourceMappingURL=puts.js.map