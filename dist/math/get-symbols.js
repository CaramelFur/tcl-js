(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./instruction", "./contains"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var instruction_1 = require("./instruction");
    var contains_1 = require("./contains");
    function getSymbols(tokens, symbols, options) {
        options = options || {};
        var withMembers = !!options.withMembers;
        var prevVar = null;
        for (var i = 0; i < tokens.length; i++) {
            var item = tokens[i];
            if (item.type === instruction_1.IVAR && !contains_1.default(symbols, item.value)) {
                if (!withMembers) {
                    symbols.push(item.value);
                }
                else if (prevVar !== null) {
                    if (!contains_1.default(symbols, prevVar)) {
                        symbols.push(prevVar);
                    }
                    prevVar = item.value;
                }
                else {
                    prevVar = item.value;
                }
            }
            else if (item.type === instruction_1.IMEMBER && withMembers && prevVar !== null) {
                prevVar += '.' + item.value;
            }
            else if (item.type === instruction_1.IEXPR) {
                getSymbols(item.value, symbols, options);
            }
            else if (prevVar !== null) {
                if (!contains_1.default(symbols, prevVar)) {
                    symbols.push(prevVar);
                }
                prevVar = null;
            }
        }
        if (prevVar !== null && !contains_1.default(symbols, prevVar)) {
            symbols.push(prevVar);
        }
    }
    exports.default = getSymbols;
});
//# sourceMappingURL=get-symbols.js.map