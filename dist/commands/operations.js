(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../types", "./basic", "../tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var types_1 = require("../types");
    var basic_1 = require("./basic");
    var tclerror_1 = require("../tclerror");
    function Load(scope) {
        scope.defineProc('incr', function (interpreter, orgs, command, helpers) {
            var args = orgs;
            var varName = args[0].getValue();
            var increment = 1;
            if (args[1]) {
                if (!args[1].isNumber())
                    throw new tclerror_1.TclError("expected integer but got \"" + args[1].getValue() + "\"");
                else
                    increment = args[1].getNumber();
            }
            var out;
            var solved = basic_1.solveVar(varName, helpers);
            var fetched = interpreter.getScope().resolve(solved.name);
            if (!fetched) {
                out = new types_1.TclSimple(increment, solved.name);
            }
            else {
                if (!(fetched instanceof types_1.TclSimple))
                    return helpers.sendHelp('wtype');
                if (!fetched.isNumber())
                    throw new tclerror_1.TclError("expected integer but got \"" + fetched.getValue() + "\"");
                out = new types_1.TclSimple(fetched.getNumber() + increment, fetched.getName());
            }
            interpreter.setVariable(solved.name, solved.key, out);
            return out;
        }, {
            arguments: {
                pattern: 'incr variable ?increment?',
                amount: {
                    start: 1,
                    end: 2,
                },
                simpleOnly: true,
            },
        });
    }
    exports.Load = Load;
});
//# sourceMappingURL=operations.js.map