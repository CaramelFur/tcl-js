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
    function LoadSet(commandScope) {
        commandScope.addProc({
            command: 'set',
            argsBase: 'varName ?newValue?',
        }, function (interpreter, scope, args, helpers) {
            if (!args[0])
                helpers.wrongNumArgs();
            if (args[1]) {
                scope.setVariable(args[0].getValue(), null, args[1]);
                return args[1];
            }
            else {
                return scope.getVariable(args[0].getValue());
            }
        });
    }
    exports.default = LoadSet;
});
//# sourceMappingURL=set.js.map