(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./scope", "./io", "fs", "./interpreter"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var scope_1 = require("./scope");
    var io_1 = require("./io");
    var fs = require("fs");
    var interpreter_1 = require("./interpreter");
    var Tcl = (function () {
        function Tcl(disableCommands) {
            this.io = new io_1.IO();
            this.disabledCommands = [];
            this.disabledCommands = disableCommands;
            this.globalScope = new scope_1.Scope(undefined, disableCommands);
        }
        Tcl.prototype.run = function (input) {
            var interpreter = new interpreter_1.Interpreter(this, input, this.globalScope);
            return interpreter.run();
        };
        Tcl.prototype.runFile = function (location) {
            var buffer = fs.readFileSync(location, { encoding: 'utf-8' });
            return this.run(buffer);
        };
        return Tcl;
    }());
    exports.Tcl = Tcl;
});
//# sourceMappingURL=tcl.js.map