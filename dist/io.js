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
    var IO = (function () {
        function IO() {
        }
        IO.prototype.write = function (channelId, string) {
            switch (channelId) {
                case 'stdout':
                    process.stdout.write(string);
                    break;
                default:
                    throw new Error("can not find channel named \"" + channelId + "\"");
            }
        };
        return IO;
    }());
    exports.IO = IO;
});
//# sourceMappingURL=io.js.map