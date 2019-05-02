(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../types"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var types_1 = require("../types");
    function Load(scope) {
        scope.defineProc('list', function (interpreter, args, command, helpers) {
            args = args;
            args = args.map(function (arg) { return (arg.indexOf(' ') > -1 ? "{" + arg + "}" : arg); });
            return new types_1.TclSimple(args.join(' '));
        }, {
            arguments: {
                pattern: 'list ?arg arg ...?',
                amount: {
                    start: 1,
                    end: -1,
                },
                textOnly: true,
            },
        });
        scope.defineProc('lindex', function (interpreter, oldArgs, command, helpers) {
            var _a;
            var args = oldArgs;
            var numArr = [];
            for (var i = 1; i < args.length; i++) {
                if (!args[i].isNumber())
                    return helpers.sendHelp('wtype');
                numArr[i - 1] = args[i].getNumber();
            }
            var simple = args[0];
            return (_a = simple.getList()).getSubValue.apply(_a, numArr);
        }, {
            arguments: {
                pattern: 'list list ?index ...?',
                amount: {
                    start: 1,
                    end: -1,
                },
                simpleOnly: true,
            },
        });
    }
    exports.Load = Load;
});
//# sourceMappingURL=list.js.map