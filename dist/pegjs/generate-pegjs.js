(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs", "path", "pegjs", "ts-pegjs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var fs = require("fs");
    var path = require("path");
    var pegjs = require("pegjs");
    var tspegjs = require("ts-pegjs");
    var pegjsExtension = 'pegjs';
    var parsersPath = path.join(__dirname, './source');
    var outputPath = path.join(__dirname, './parsers');
    var parsers = fs
        .readdirSync(parsersPath)
        .filter(function (file) { return file.endsWith("." + pegjsExtension); });
    for (var _i = 0, parsers_1 = parsers; _i < parsers_1.length; _i++) {
        var parser = parsers_1[_i];
        console.log('Generating', parser);
        var extensionLessFilename = parser.split('.').slice(0, -1).join('.');
        var outputFilePath = path.join(outputPath, extensionLessFilename + '.ts');
        var pegjsFilePath = path.join(parsersPath, parser);
        var pegjsFile = fs.readFileSync(pegjsFilePath, 'utf-8');
        var fullPegjsFile = appendImports(pegjsFile, pegjsFilePath);
        var parserFile = '';
        try {
            parserFile = pegjs.generate(fullPegjsFile, {
                output: 'source',
                format: 'commonjs',
                plugins: [tspegjs],
            });
        }
        catch (e) {
            throw new Error('Error at: ' + pegjsFilePath + ' : ' + e.message);
        }
        fs.writeFileSync(outputFilePath, parserFile);
        console.log('  Successfully generated', parser);
    }
    console.log('Successfully generated all parsers\n');
    function appendImports(pegjsFile, pegjsFilePath, depth) {
        if (depth === void 0) { depth = 1; }
        var processedPegjsFile = pegjsFile.replace(/^\/\/import "(.*)"$/gm, function (match, importpath) {
            var pegjsFileDirPath = path.dirname(pegjsFilePath);
            var importFilePath = path.join(pegjsFileDirPath, importpath + '.' + pegjsExtension);
            var importFileName = path.basename(importFilePath);
            console.log(' '.repeat(depth * 2) + '└───Importing', importFileName);
            var importFile = '';
            try {
                importFile = fs.readFileSync(importFilePath, 'utf-8');
            }
            catch (e) {
                console.log('Could not find', importFilePath);
            }
            var fullImportFile = appendImports(importFile, importFilePath, depth + 1);
            return fullImportFile + '\n';
        });
        return processedPegjsFile;
    }
});
//# sourceMappingURL=generate-pegjs.js.map