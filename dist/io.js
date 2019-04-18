(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./tclerror"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tclerror_1 = require("./tclerror");
    var IO = (function () {
        function IO() {
        }
        IO.prototype.write = function (channelId, string) {
            switch (channelId) {
                case 'stdout':
                    process.stdout.write(string);
                    break;
                case 'stderr':
                    process.stderr.write(string);
                    break;
                default:
                    throw new tclerror_1.TclError("can not find channel named \"" + channelId + "\"");
            }
        };
        return IO;
    }());
    exports.IO = IO;
});
//# sourceMappingURL=io.js.map