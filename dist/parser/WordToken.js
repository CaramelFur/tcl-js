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
    exports.VariablePart = exports.CodePart = exports.EscapePart = exports.EscapePartType = exports.TextPart = void 0;
    var TextPart = (function () {
        function TextPart(value) {
            this.value = value;
        }
        return TextPart;
    }());
    exports.TextPart = TextPart;
    var EscapePartType;
    (function (EscapePartType) {
        EscapePartType["normal"] = "normal";
        EscapePartType["octal"] = "octal";
        EscapePartType["hex"] = "hex";
        EscapePartType["hex16"] = "hex16";
        EscapePartType["hex32"] = "hex32";
    })(EscapePartType = exports.EscapePartType || (exports.EscapePartType = {}));
    var EscapePart = (function () {
        function EscapePart(unparsed) {
            var clean = unparsed.slice(1);
            switch (clean[0]) {
                case 'x':
                    this.type = EscapePartType.hex;
                    this.backslashValue = clean.slice(1);
                    break;
                case 'u':
                    this.type = EscapePartType.hex16;
                    this.backslashValue = clean.slice(1);
                    break;
                case 'U':
                    this.type = EscapePartType.hex32;
                    this.backslashValue = clean.slice(1);
                    break;
                default: {
                    var cint = parseInt(clean[0], 10);
                    if (cint >= 0 && cint <= 7) {
                        this.type = EscapePartType.octal;
                        this.backslashValue = clean;
                    }
                    else {
                        this.type = EscapePartType.normal;
                        this.backslashValue = clean;
                    }
                }
            }
        }
        return EscapePart;
    }());
    exports.EscapePart = EscapePart;
    var CodePart = (function () {
        function CodePart(value) {
            this.value = value;
        }
        return CodePart;
    }());
    exports.CodePart = CodePart;
    var VariablePart = (function () {
        function VariablePart(name, index) {
            if (index === void 0) { index = null; }
            this.name = name;
            this.index = index;
        }
        return VariablePart;
    }());
    exports.VariablePart = VariablePart;
});
//# sourceMappingURL=WordToken.js.map