(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./puts", "./basic", "./list", "./proc", "./if", "./switch", "./loops"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var puts_1 = require("./puts");
    var basic_1 = require("./basic");
    var list_1 = require("./list");
    var proc_1 = require("./proc");
    var if_1 = require("./if");
    var switch_1 = require("./switch");
    var loops_1 = require("./loops");
    var LoadFunctions = [
        puts_1.Load,
        basic_1.Load,
        list_1.Load,
        proc_1.Load,
        if_1.Load,
        switch_1.Load,
        loops_1.Load,
    ];
    exports.LoadFunctions = LoadFunctions;
});
//# sourceMappingURL=index.js.map