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
    exports.ReplaceEscapeChar = void 0;
    var bakedEscapeChars = {
        a: 0x7,
        b: 0x8,
        f: 0xc,
        n: 0xa,
        r: 0xd,
        t: 0x9,
        v: 0xb,
    };
    var bakedEscapeCharsList = Object.keys(bakedEscapeChars);
    function ReplaceEscapeChar(char) {
        if (bakedEscapeCharsList.indexOf(char) >= 0) {
            return String.fromCharCode(bakedEscapeChars[char]);
        }
        return char;
    }
    exports.ReplaceEscapeChar = ReplaceEscapeChar;
});
//# sourceMappingURL=HandleEscape.js.map