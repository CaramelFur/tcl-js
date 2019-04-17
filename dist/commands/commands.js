(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./puts", "./basic", "./list"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var puts_1 = require("./puts");
    var basic_1 = require("./basic");
    var list_1 = require("./list");
    var LoadFunctions = [puts_1.Load, basic_1.Load, list_1.Load];
    exports.LoadFunctions = LoadFunctions;
});
//# sourceMappingURL=commands.js.map