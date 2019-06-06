var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./lexer", "./tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var lexer_1 = require("./lexer");
    var tclerror_1 = require("./tclerror");
    var Parser = (function () {
        function Parser(input) {
            this.program = {
                commands: [],
            };
            this.lexer = new lexer_1.Lexer(input);
            var toProcess = this.lexer.nextToken();
            while (toProcess) {
                if (toProcess.index === 0) {
                    this.program.commands.push({
                        command: toProcess.value,
                        args: [],
                        source: toProcess.source,
                        sourceLocation: toProcess.sourceLocation,
                    });
                }
                else {
                    if (this.program.commands.length === 0)
                        throw new tclerror_1.TclError('encountered argument but no command exists');
                    this.program.commands[this.program.commands.length - 1].args.push(__assign({
                        value: toProcess.value,
                        hasVariable: toProcess.hasVariable,
                        hasSubExpr: toProcess.hasSubExpr,
                        stopBackslash: toProcess.stopBackslash,
                    }, (toProcess.expand ? { expand: true } : {})));
                    this.program.commands[this.program.commands.length - 1].source =
                        toProcess.source;
                }
                toProcess = this.lexer.nextToken();
            }
        }
        Parser.prototype.get = function () {
            return this.program;
        };
        return Parser;
    }());
    exports.Parser = Parser;
});
//# sourceMappingURL=parser.js.map