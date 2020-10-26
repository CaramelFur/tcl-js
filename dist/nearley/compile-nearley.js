var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs", "path", "./nearley-there"], factory);
    }
})(function (require, exports) {
    "use strict";
    var e_1, _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    var fs = require("fs");
    var path = require("path");
    var nearleyThere = require("./nearley-there");
    var nearleyExtension = 'ne';
    var parsersPath = path.join(__dirname, './source');
    var outputPath = path.join(__dirname, './parsers');
    var parsers = fs
        .readdirSync(parsersPath)
        .filter(function (file) { return file.endsWith("." + nearleyExtension); });
    try {
        for (var parsers_1 = __values(parsers), parsers_1_1 = parsers_1.next(); !parsers_1_1.done; parsers_1_1 = parsers_1.next()) {
            var parser = parsers_1_1.value;
            console.log('Generating', parser);
            var extensionLessFilename = parser.split('.').slice(0, -1).join('.');
            var outputFilePath = path.join(outputPath, extensionLessFilename + '.ts');
            var nearleyFilePath = path.join(parsersPath, parser);
            var parserFile = '';
            try {
                parserFile = nearleyThere.compile(nearleyFilePath, nearleyFilePath);
            }
            catch (e) {
                e.message = 'Error at: ' + nearleyFilePath + ' : ' + e.message;
                throw e;
            }
            fs.writeFileSync(outputFilePath, parserFile);
            console.log('  Successfully generated', extensionLessFilename + '.ts');
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (parsers_1_1 && !parsers_1_1.done && (_a = parsers_1.return)) _a.call(parsers_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
//# sourceMappingURL=compile-nearley.js.map