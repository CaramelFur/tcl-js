(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../types", "../tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var types_1 = require("../types");
    var tclerror_1 = require("../tclerror");
    function Load(scope) {
        scope.defineProc('list', function (interpreter, args, command, helpers) {
            if (args.length === 0)
                return helpers.sendHelp('warg');
            for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
                var arg = args_1[_i];
                if (!(arg instanceof types_1.TclSimple))
                    return helpers.sendHelp('wtype');
            }
            var stringArgs = args.map(function (arg) { return arg.getValue(); });
            stringArgs = stringArgs.map(function (arg) { return (arg.indexOf(' ') > -1 ? "{" + arg + "}" : arg); });
            return new types_1.TclSimple(stringArgs.join(' '));
        }, {
            pattern: 'list ?arg arg ...?',
            helpMessages: {
                wargs: "wrong # args",
                wtype: "wrong type",
            },
        });
        scope.defineProc('lindex', function (interpreter, args, command, helpers) {
            var _a;
            if (args.length === 0)
                throw new tclerror_1.TclError('wrong # args: should be "');
            for (var _i = 0, args_2 = args; _i < args_2.length; _i++) {
                var arg = args_2[_i];
                if (!(arg instanceof types_1.TclSimple))
                    return helpers.sendHelp('wtype');
            }
            var numArr = [];
            for (var i = 1; i < args.length; i++) {
                if (!args[i].isNumber())
                    return helpers.sendHelp('wtype');
                numArr[i - 1] = args[i].getNumber();
            }
            var simple = args[0];
            return (_a = simple.getList()).getSubValue.apply(_a, numArr);
        }, {
            pattern: 'list list ?index ...?',
            helpMessages: {
                wargs: "wrong # args",
                wtype: "wrong type",
            },
        });
    }
    exports.Load = Load;
});
//# sourceMappingURL=list.js.map