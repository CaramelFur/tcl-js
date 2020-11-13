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
    exports.createPush = exports.createPop = exports.dot = exports.advancedEscapeRegex = exports.escapeRegex = exports.escapeNlRegex = exports.nlwsregex = exports.wsregex = void 0;
    exports.wsregex = /[ \t\v\f\r]/;
    exports.nlwsregex = /[ \t\v\f\r\n]/;
    exports.escapeNlRegex = /\\\n[ \t\v\f\r]*/;
    exports.escapeRegex = /\\.|[^\\]|\\/;
    exports.advancedEscapeRegex = /\\(?:[0-7]{1,3}|x[0-9a-fA-F]{1,2}|u[0-9a-fA-F]{1,4}|U[0-9a-fA-F]{1,8}|.)/;
    exports.dot = /./;
    exports.createPop = function (lexer) { return function (amount) { return function (value) {
        for (var i = 0; i < amount; i++)
            lexer().popState();
        return value;
    }; }; };
    exports.createPush = function (lexer) { return function () {
        var pushes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            pushes[_i] = arguments[_i];
        }
        return function (value) {
            for (var i = 0; i < pushes.length; i++)
                lexer().pushState(pushes[i]);
            return value;
        };
    }; };
});
//# sourceMappingURL=base.js.map