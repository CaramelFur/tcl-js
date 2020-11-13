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
    exports.TclWord = exports.TclWordTypes = exports.TclComment = exports.TclCommand = exports.TclScript = void 0;
    var TclScript = (function () {
        function TclScript(commands) {
            this.commands = commands;
        }
        TclScript.prototype.prepend = function (value) {
            this.commands.unshift(value);
            return this;
        };
        return TclScript;
    }());
    exports.TclScript = TclScript;
    var TclCommand = (function () {
        function TclCommand(words, line, col) {
            this.words = words;
            this.line = line;
            this.col = col;
        }
        TclCommand.prototype.prepend = function (value) {
            this.words.unshift(value);
            return this;
        };
        return TclCommand;
    }());
    exports.TclCommand = TclCommand;
    var TclComment = (function () {
        function TclComment(value, line, col) {
            this.value = value;
            this.line = line;
            this.col = col;
        }
        return TclComment;
    }());
    exports.TclComment = TclComment;
    var TclWordTypes;
    (function (TclWordTypes) {
        TclWordTypes["normal"] = "normal";
        TclWordTypes["brace"] = "brace";
    })(TclWordTypes = exports.TclWordTypes || (exports.TclWordTypes = {}));
    var TclWord = (function () {
        function TclWord(value, line, col, type, expand) {
            if (type === void 0) { type = TclWordTypes.normal; }
            if (expand === void 0) { expand = false; }
            this.type = type;
            this.value = value;
            this.expand = expand;
            this.line = line;
            this.col = col;
        }
        TclWord.prototype.setExpand = function (value, line, col) {
            this.expand = value;
            this.line = line;
            this.col = col;
            return this;
        };
        return TclWord;
    }());
    exports.TclWord = TclWord;
});
//# sourceMappingURL=TclToken.js.map