(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./io", "./scope", "./commands", "./parser", "fs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var io_1 = require("./io");
    var scope_1 = require("./scope");
    var commands_1 = require("./commands");
    var parser_1 = require("./parser");
    var fs = require("fs");
    var Tcl = (function () {
        function Tcl(disableCommands) {
            this.currentScope = new scope_1.Scope();
            this.io = new io_1.IO();
            this.commands = new commands_1.CommandSet(this);
            this.lastResult = null;
            this.disabledCommands = [];
            this.disabledCommands = disableCommands;
        }
        Tcl.prototype.run = function (input) {
            var ast = parser_1.Parse(input);
            console.log(JSON.stringify(ast));
            for (var _i = 0, _a = ast.statements; _i < _a.length; _i++) {
                var statement = _a[_i];
                var _b = statement.words.map(this.mapWord), cmd = _b[0], args = _b.slice(1);
                this.lastResult = this.commands.invoke(cmd, args) || '';
            }
            return this.lastResult;
        };
        Tcl.prototype.runFile = function (location) {
            var buffer = fs.readFileSync(location, { encoding: 'utf-8' });
            return this.run(buffer);
        };
        Tcl.prototype.mapWord = function (word) {
            var _this = this;
            var value = word.value;
            if (word.hasVariable) {
                value = value.replace(/\$\S+/g, function (match) {
                    return _this.currentScope.resolve(match.slice(1)).value;
                });
            }
            return value;
        };
        return Tcl;
    }());
    exports.Tcl = Tcl;
});
//# sourceMappingURL=tcl.js.map