(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "util", "../parser", "../parser/WordToken", "../TclError", "./variables/TclVariable"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util = require("util");
    var parser_1 = require("../parser");
    var WordToken_1 = require("../parser/WordToken");
    var TclError_1 = require("../TclError");
    var TclVariable_1 = require("./variables/TclVariable");
    function SubstituteWord(word) {
        var parsed = parser_1.ParseWord(word.value);
        var substituted = parsed.map(substitutePart);
        console.log(word.value, ':', util.inspect(substituted.join(''), false, Infinity, true));
        return new TclVariable_1.TclVariable(word.value);
    }
    exports.default = SubstituteWord;
    function substitutePart(part) {
        if (part instanceof WordToken_1.TextPart) {
            return part.value;
        }
        if (part instanceof WordToken_1.EscapePart) {
            switch (part.type) {
                case 'normal':
                    return handleEscapeChar(part.backslashValue);
                case 'octal':
                    return String.fromCharCode(parseInt(part.backslashValue, 8));
                case 'hex':
                case 'hex16':
                case 'hex32':
                    return String.fromCharCode(parseInt(part.backslashValue, 16));
            }
        }
        if (part instanceof WordToken_1.CodePart) {
            return '{code}';
        }
        if (part instanceof WordToken_1.VariablePart) {
            return '{var}';
        }
        throw new TclError_1.TclError('Encountered unkown object');
    }
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
    function handleEscapeChar(char) {
        if (bakedEscapeCharsList.indexOf(char) >= 0) {
            return String.fromCharCode(bakedEscapeChars[char]);
        }
        return char;
    }
});
//# sourceMappingURL=Substitutor.js.map