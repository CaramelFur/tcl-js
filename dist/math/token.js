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
    exports.TEOF = 'TEOF';
    exports.TOP = 'TOP';
    exports.TNUMBER = 'TNUMBER';
    exports.TSTRING = 'TSTRING';
    exports.TPAREN = 'TPAREN';
    exports.TCOMMA = 'TCOMMA';
    exports.TNAME = 'TNAME';
    function Token(type, value, index) {
        this.type = type;
        this.value = value;
        this.index = index;
    }
    exports.Token = Token;
    Token.prototype.toString = function () {
        return this.type + ': ' + this.value;
    };
});
//# sourceMappingURL=token.js.map